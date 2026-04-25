# TUS Upload Proxy Fix Design

## Overview

The current TUS upload implementation proxies all upload traffic through Vercel serverless functions, which fundamentally cannot handle files larger than 4.5MB due to Vercel's request body limits. This design removes the proxy architecture entirely and replaces it with scoped Pinata API keys that allow browsers to upload directly to Pinata's TUS endpoint. The fix also corrects the scoped key permissions to grant only minimal upload access instead of full admin rights.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a TUS upload chunk exceeds Vercel's 4.5MB body limit, or when the build fails due to duplicate runtime exports, or when scoped keys grant excessive permissions
- **Property (P)**: The desired behavior - browsers upload directly to Pinata using scoped keys with minimal permissions, supporting files of any size without unhandled errors
- **Preservation**: Existing upload progress callbacks, CID retrieval flow, retry logic, and calling code interfaces must remain unchanged
- **TUS (tus-js-client)**: Open protocol for resumable file uploads used by the application
- **Scoped Key**: A Pinata API key with limited permissions and usage limits, safe to expose to the browser
- **Vercel Body Limit**: 4.5MB maximum request body size for serverless functions, which makes proxying large uploads impossible

## Bug Details

### Bug Condition

The bug manifests under multiple conditions that all stem from the proxy architecture:

1. **Build Failure**: Duplicate `export const runtime = "nodejs"` declarations in both TUS proxy route files cause compilation errors
2. **Upload Size Limit**: TUS chunks exceeding 4.5MB return 413 Payload Too Large errors from Vercel
3. **Security Vulnerability**: Scoped keys grant `admin: true` permissions, exposing full account access

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UploadRequest | BuildRequest | KeyRequest
  OUTPUT: boolean
  
  // Build-time bug
  IF input.type == "build" THEN
    RETURN existsDuplicateRuntimeExports("src/app/api/pinata/tus/")
  END IF
  
  // Upload-time bug
  IF input.type == "upload" THEN
    RETURN input.chunkSize > 4500000  // 4.5MB in bytes
           AND input.routesThroughVercelProxy == true
  END IF
  
  // Security bug
  IF input.type == "key_request" THEN
    RETURN input.scopedKey.permissions.admin == true
  END IF
  
  RETURN false
END FUNCTION
```

### Examples

- **Build Failure**: Running `next build` fails with "Duplicate export of 'runtime'" error when both `route.ts` files export `runtime`
- **Small File Upload (under 4.5MB)**: A 3MB file uploads successfully because each 4MB chunk is actually sent as partial content, staying under the limit
- **Large File Upload (15GB)**: A 15GB video file fails with 413 error because Vercel's proxy cannot handle the cumulative request volume
- **Scoped Key Request**: Calling `/api/pinata/jwt` returns a key with `permissions: { admin: true }` instead of minimal upload-only permissions

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- TUS upload progress reporting via `onProgress` callback with bytes sent and total bytes
- CID extraction and polling from `/api/pinata/file-info` after upload completion
- Retry logic with exponential backoff using delays [0, 1000, 3000, 5000, 10000]
- `onFileCreated` callback firing when Pinata file UUID becomes available
- `startTusUpload` function interface remaining identical for calling code in `MintMetadataForm.tsx` and `fileUpload.tsx`
- File info endpoint accepting file ID and optional filename, returning CID

**Scope:**
All upload flows that use `startTusUpload` should work identically from the caller's perspective. The only visible change is that uploads will succeed for files of any size instead of failing for large files.

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Architectural Mismatch**: The proxy architecture was designed to hide the PINATA_JWT from clients, but Vercel's serverless functions have a hard 4.5MB body limit that makes proxying large file chunks impossible. This is a fundamental platform constraint, not a fixable bug.

2. **Duplicate Runtime Exports**: Both `src/app/api/pinata/tus/route.ts` and `src/app/api/pinata/tus/[...path]/route.ts` export `runtime = "nodejs"`. Next.js doesn't allow duplicate exports across route handlers in the same route segment.

3. **Incorrect Scoped Key Permissions**: The `/api/pinata/jwt` endpoint sets `permissions: { admin: true }` which was likely used for testing but defeats the security purpose of scoped keys. The commented-out code shows the correct structure was known but not implemented.

4. **Proxy URL Return**: The `/api/pinata/signed-upload-url` endpoint returns `{ url: "/api/pinata/tus", token: "" }` which routes all traffic through the proxy instead of directly to Pinata.

## Correctness Properties

Property 1: Bug Condition - Large File Upload Support

_For any_ file upload where the file size exceeds 4.5MB (up to 15GB), the fixed system SHALL complete the upload successfully without 413 Payload Too Large errors by routing TUS chunks directly to Pinata's endpoint bypassing Vercel's serverless body limits.

**Validates: Requirements 2.2**

Property 2: Bug Condition - Build Success

_For any_ Next.js build attempt, the fixed system SHALL compile successfully without duplicate runtime export errors by removing the TUS proxy route files entirely.

**Validates: Requirements 2.1**

Property 3: Bug Condition - Scoped Key Security

_For any_ scoped key request to `/api/pinata/jwt`, the fixed system SHALL return a key with minimal permissions limited to file upload operations only, without admin access.

**Validates: Requirements 2.3**

Property 4: Bug Condition - Direct Upload URL

_For any_ signed upload URL request to `/api/pinata/signed-upload-url`, the fixed system SHALL return Pinata's direct TUS endpoint URL (`https://uploads.pinata.cloud/v3/files`) with a valid scoped key token.

**Validates: Requirements 2.4, 2.5**

Property 5: Preservation - Upload Progress Callbacks

_For any_ TUS upload in progress, the fixed system SHALL continue to report progress via the `onProgress` callback with accurate bytes sent and total bytes values.

**Validates: Requirements 3.2**

Property 6: Preservation - CID Retrieval Flow

_For any_ completed TUS upload, the fixed system SHALL continue to extract the CID from the upload URL and poll `/api/pinata/file-info` to retrieve the IPFS CID.

**Validates: Requirements 3.1**

Property 7: Preservation - Retry Logic

_For any_ failed TUS upload chunk, the fixed system SHALL continue to retry with exponential backoff using the existing retry delays [0, 1000, 3000, 5000, 10000].

**Validates: Requirements 3.3**

Property 8: Preservation - Function Interface

_For any_ call to `startTusUpload` from `MintMetadataForm.tsx` or `fileUpload.tsx`, the fixed system SHALL accept the same parameter interface without requiring changes to calling code.

**Validates: Requirements 3.5**

## Fix Implementation

### Changes Required

**Files to Delete:**
1. `src/app/api/pinata/tus/route.ts` - Remove TUS proxy POST handler
2. `src/app/api/pinata/tus/[...path]/route.ts` - Remove TUS proxy PATCH/HEAD handler

**Files to Modify:**

**File**: `src/app/api/pinata/jwt/route.ts`

**Function**: `POST`

**Specific Changes**:
1. **Remove Admin Permissions**: Replace `permissions: { admin: true }` with scoped permissions object
2. **Add Minimal Permissions**: Set permissions to only allow file pinning operations:
   ```typescript
   permissions: {
     endpoints: {
       pinning: {
         pinFileToIPFS: true,
       },
     },
   }
   ```
3. **Set Usage Limits**: Keep `maxUses: 100` to limit key lifetime
4. **Remove Debug Logging**: Clean up console.log statements for production

**File**: `src/app/api/pinata/signed-upload-url/route.ts`

**Function**: `POST`

**Specific Changes**:
1. **Return Direct Pinata URL**: Change URL from `/api/pinata/tus` to `https://uploads.pinata.cloud/v3/files`
2. **Return Scoped Key Token**: Call `/api/pinata/jwt` internally and return the token
3. **Add Error Handling**: Handle JWT generation failures gracefully

**File**: `src/lib/tusUpload.ts`

**Function**: `startTusUpload`

**Specific Changes**:
1. **Increase Chunk Size**: Change `chunkSize` from `4 * 1024 * 1024` (4MB) to `50 * 1024 * 1024` (50MB) since we're no longer limited by Vercel's proxy
2. **Always Send Authorization**: Remove the conditional token check - always send Authorization header when token is provided
3. **Update URL Extraction**: Ensure `extractCid` function handles both proxy URLs and direct Pinata URLs correctly (already handles both)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the build succeeds and scoped keys have correct permissions, then verify large file uploads work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: 
1. Run `next build` to observe duplicate runtime export error
2. Call `/api/pinata/jwt` and inspect returned key permissions
3. Attempt a large file upload (100MB+) and observe 413 error

**Test Cases**:
1. **Build Test**: Run `next build` on unfixed code (will fail with duplicate export error)
2. **Key Permissions Test**: Call `/api/pinata/jwt`, decode JWT, verify `admin: true` permission exists
3. **Large Upload Test**: Upload 100MB file, observe 413 error from Vercel proxy
4. **Signed URL Test**: Call `/api/pinata/signed-upload-url`, verify it returns proxy URL

**Expected Counterexamples**:
- Build fails with "Duplicate export of 'runtime'"
- Scoped key has `admin: true` in permissions
- Upload fails with 413 status for chunks > 4.5MB
- Signed URL returns `/api/pinata/tus` instead of Pinata direct URL

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
// Build check
FOR build_attempt DO
  result := next_build()
  ASSERT result.status == "success"
  ASSERT no_duplicate_export_errors(result)
END FOR

// Upload check
FOR ALL file WHERE file.size <= 15GB DO
  result := upload_file(file)
  ASSERT result.status == "success"
  ASSERT result.cid IS valid_ipfs_cid
END FOR

// Key check
FOR ALL key_request DO
  key := get_scoped_key()
  ASSERT key.permissions.admin == false OR undefined
  ASSERT key.permissions.endpoints.pinning.pinFileToIPFS == true
END FOR

// URL check
FOR ALL url_request DO
  url := get_signed_url()
  ASSERT url == "https://uploads.pinata.cloud/v3/files"
  ASSERT token IS valid_jwt
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (existing functionality), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL upload WHERE upload.completes_successfully DO
  ASSERT onProgress_called_with_correct_bytes(fixed) == onProgress_called_with_correct_bytes(original)
  ASSERT onFileCreated_called_with_uuid(fixed) == onFileCreated_called_with_uuid(original)
  ASSERT onSuccess_called_with_cid(fixed) == onSuccess_called_with_cid(original)
END FOR

FOR ALL failed_chunk DO
  ASSERT retry_behavior(fixed) == retry_behavior(original)
  ASSERT retry_delays == [0, 1000, 3000, 5000, 10000]
END FOR

FOR ALL file_info_request DO
  ASSERT file_info_response(fixed) == file_info_response(original)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Cases**:
1. **Progress Callback Preservation**: Upload small file, verify `onProgress` receives correct byte counts
2. **CID Retrieval Preservation**: Complete upload, verify CID polling works correctly
3. **Retry Logic Preservation**: Simulate network failure, verify retry delays match expected values
4. **Interface Preservation**: Call `startTusUpload` with existing parameters, verify no type errors

### Unit Tests

- Test `/api/pinata/jwt` returns key with correct permissions (no admin, has pinning)
- Test `/api/pinata/signed-upload-url` returns Pinata direct URL with token
- Test `startTusUpload` sends Authorization header when token provided
- Test `extractCid` handles both proxy and direct Pinata URLs
- Test chunk size is set to 50MB

### Property-Based Tests

- Generate random file sizes (1MB to 15GB), verify upload configuration handles all sizes
- Generate random upload states, verify progress callbacks receive valid byte values
- Generate random failure scenarios, verify retry logic produces correct delay sequences
- Generate random Pinata response URLs, verify CID extraction works for all formats

### Integration Tests

- Test complete upload flow: request signed URL → upload file → retrieve CID
- Test upload flow with progress tracking: verify callbacks fire at expected intervals
- Test upload retry flow: simulate failure, verify retry and eventual success
- Test large file upload (100MB+) completes successfully without 413 error
- Test file-info endpoint still returns CID after direct-to-Pinata upload
