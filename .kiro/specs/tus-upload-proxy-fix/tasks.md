# Implementation Plan

## Overview

This plan fixes the TUS upload proxy issues by removing the proxy architecture and enabling direct browser-to-Pinata uploads using scoped keys with minimal permissions.

---

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Build Failure and Upload Size Limit
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  - **Scoped PBT Approach**: For deterministic bugs, scope properties to concrete failing cases
  - Test 1: Run `next build` and verify it fails with duplicate runtime export error
  - Test 2: Call `/api/pinata/jwt` and verify returned key has `admin: true` permissions
  - Test 3: Call `/api/pinata/signed-upload-url` and verify it returns proxy URL `/api/pinata/tus`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found (e.g., "Build fails with 'Duplicate export of runtime'", "Scoped key has admin: true")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Upload Flow Behavior Preservation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (small files under 4.5MB)
  - Write property-based tests capturing observed behavior patterns:
    - Progress callback receives correct byte counts during upload
    - CID extraction works from upload URL
    - Retry logic uses delays [0, 1000, 3000, 5000, 10000]
    - `startTusUpload` function interface accepts expected parameters
    - File-info endpoint returns CID for completed uploads
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code with small files
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [-] 3. Fix for TUS upload proxy issues

  - [x] 3.1 Delete TUS proxy routes
    - Delete `src/app/api/pinata/tus/route.ts` (POST handler)
    - Delete `src/app/api/pinata/tus/[...path]/route.ts` (PATCH/HEAD handler)
    - Remove the entire `src/app/api/pinata/tus/` directory
    - _Bug_Condition: isBugCondition(build) where duplicate runtime exports exist_
    - _Expected_Behavior: Build succeeds without duplicate export errors_
    - _Preservation: No preservation concerns - these routes are being removed entirely_
    - _Requirements: 2.1_

  - [x] 3.2 Fix scoped key permissions in /api/pinata/jwt
    - Replace `permissions: { admin: true }` with minimal scoped permissions
    - Set permissions to only allow file pinning operations:
      ```typescript
      permissions: {
        endpoints: {
          pinning: {
            pinFileToIPFS: true,
          },
        },
      }
      ```
    - Keep `maxUses: 100` to limit key lifetime
    - Remove debug console.log statements for production
    - _Bug_Condition: isBugCondition(key_request) where scopedKey.permissions.admin == true_
    - _Expected_Behavior: Key has minimal permissions without admin access_
    - _Preservation: Key generation flow remains the same, only permissions change_
    - _Requirements: 2.3_

  - [x] 3.3 Update /api/pinata/signed-upload-url to return direct Pinata URL
    - Change URL from `/api/pinata/tus` to `https://uploads.pinata.cloud/v3/files`
    - Call `/api/pinata/jwt` internally and return the token
    - Add error handling for JWT generation failures
    - Return response format: `{ url: "https://uploads.pinata.cloud/v3/files", token: "<scoped-key>" }`
    - _Bug_Condition: isBugCondition(url_request) where url routes through Vercel proxy_
    - _Expected_Behavior: URL points to Pinata direct endpoint with valid scoped key_
    - _Preservation: Response interface remains the same (url + token)_
    - _Requirements: 2.4, 2.5_

  - [x] 3.4 Update tusUpload.ts with larger chunk size and proper auth
    - Change `chunkSize` from `4 * 1024 * 1024` (4MB) to `50 * 1024 * 1024` (50MB)
    - Always send Authorization header when token is provided (remove conditional check)
    - Verify `extractCid` function handles both proxy URLs and direct Pinata URLs
    - _Bug_Condition: isBugCondition(upload) where chunkSize > 4500000 AND routesThroughVercelProxy_
    - _Expected_Behavior: Chunks sent directly to Pinata without size limits_
    - _Preservation: Progress callbacks, retry logic, CID extraction remain unchanged_
    - _Requirements: 2.2, 3.1, 3.2, 3.3_

  - [x] 3.5 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - Build Success and Direct Upload
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Test 1: Run `next build` - should succeed without duplicate export errors
    - Test 2: Call `/api/pinata/jwt` - should return key without admin permissions
    - Test 3: Call `/api/pinata/signed-upload-url` - should return Pinata direct URL
    - **EXPECTED OUTCOME**: Tests PASS (confirms bugs are fixed)
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Upload Flow Behavior Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify progress callbacks work correctly
    - Verify CID extraction and polling still works
    - Verify retry logic unchanged
    - Verify `startTusUpload` interface unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify build succeeds: `next build`
  - Verify all unit tests pass
  - Verify all property-based tests pass
  - Test small file upload end-to-end
  - Test large file upload (100MB+) completes without 413 error
  - Ask the user if questions arise
