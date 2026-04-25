# Bugfix Requirements Document

## Introduction

The TUS upload proxy implementation for Pinata file uploads has three critical issues that prevent it from working correctly in production on Vercel. The current architecture proxies TUS chunks through the Next.js serverless functions, which is fundamentally incompatible with Vercel's request body limits and creates security vulnerabilities. This bugfix removes the proxy architecture and replaces it with scoped keys that allow the browser to upload directly to Pinata.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Next.js application is built THEN the system fails to compile due to duplicate `export const runtime = "nodejs"` declarations in both `src/app/api/pinata/tus/route.ts` and `src/app/api/pinata/tus/[...path]/route.ts`

1.2 WHEN a TUS upload chunk exceeds 4.5MB THEN the system returns a 413 Payload Too Large error from Vercel because the proxy streams request bodies through Vercel's serverless functions which have a 4.5MB body limit

1.3 WHEN a TUS upload chunk is between 4MB and 4.5MB THEN the system may fail unpredictably because Vercel sometimes buffers the request body instead of streaming it, causing the same 4.5MB limit to apply

1.4 WHEN a client requests a scoped key from `/api/pinata/jwt` THEN the system returns a key with `permissions: { admin: true }` which grants full admin access to the Pinata account, defeating the security purpose of scoped keys

1.5 WHEN a client initiates a TUS upload via `/api/pinata/signed-upload-url` THEN the system returns `{ url: "/api/pinata/tus", token: "" }` which routes all upload traffic through the Vercel proxy instead of directly to Pinata

### Expected Behavior (Correct)

2.1 WHEN the Next.js application is built THEN the system SHALL compile successfully with no duplicate runtime exports by removing the TUS proxy routes entirely

2.2 WHEN a client uploads a file of any size THEN the system SHALL allow the browser to send TUS chunks directly to Pinata without proxying through Vercel serverless functions

2.3 WHEN a client requests a scoped key from `/api/pinata/jwt` THEN the system SHALL return a key with minimal permissions limited to only file upload operations

2.4 WHEN a client requests a signed upload URL from `/api/pinata/signed-upload-url` THEN the system SHALL return the Pinata TUS endpoint URL (`https://uploads.pinata.cloud/v3/files`) along with a scoped key for direct browser-to-Pinata uploads

2.5 WHEN the TUS upload library (`src/lib/tusUpload.ts`) initiates an upload THEN the system SHALL send requests directly to Pinata's TUS endpoint using the scoped key for authorization

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a TUS upload completes THEN the system SHALL CONTINUE TO extract the CID from the upload URL and poll `/api/pinata/file-info` to retrieve the IPFS CID

3.2 WHEN a TUS upload is in progress THEN the system SHALL CONTINUE TO report progress via the `onProgress` callback with bytes sent and total bytes

3.3 WHEN a TUS upload fails THEN the system SHALL CONTINUE TO retry with exponential backoff using the existing retry delays [0, 1000, 3000, 5000, 10000]

3.4 WHEN a TUS upload session is created THEN the system SHALL CONTINUE TO fire the `onFileCreated` callback with the Pinata file UUID and filename

3.5 WHEN a user uploads a file from `MintMetadataForm.tsx` or `fileUpload.tsx` THEN the system SHALL CONTINUE TO use the same `startTusUpload` function interface without requiring changes to calling code

3.6 WHEN the `/api/pinata/file-info` endpoint is called THEN the system SHALL CONTINUE TO accept a file ID and optional filename parameter and return the CID
