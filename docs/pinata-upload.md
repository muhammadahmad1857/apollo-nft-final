Pinata upload — concise overview
===============================

Summary
-------
- Client performs a direct TUS upload to Pinata using a scoped token and then resolves the resulting Pinata file ID to an IPFS CID.

Flow (short)
------------
1. Get upload endpoint / token: `POST /api/pinata/signed-upload-url` — see implementation: [src/app/api/pinata/signed-upload-url/route.ts](src/app/api/pinata/signed-upload-url/route.ts#L1-L49).
2. (Server) optionally issues a scoped JWT by calling Pinata's API: [src/app/api/pinata/jwt/route.ts](src/app/api/pinata/jwt/route.ts#L1-L41).
3. Client starts a TUS upload using `startTusUpload()` in [src/lib/tusUpload.ts](src/lib/tusUpload.ts#L1-L109). The client sends `Authorization: Bearer <token>` and uploads directly to Pinata.
4. As soon as a TUS session is created the Pinata file UUID becomes available (see `onChunkComplete` / `onFileCreated` in [src/lib/tusUpload.ts](src/lib/tusUpload.ts#L1-L109)).
5. After upload completion the app calls `/api/pinata/file-info` to exchange the Pinata file ID for an IPFS CID; server lookup and fallback strategies are in [src/app/api/pinata/file-info/route.ts](src/app/api/pinata/file-info/route.ts#L1-L138).
6. If you already have a CID to pin, the server provides `POST /api/pinata/upload` (pin by hash): [src/app/api/pinata/upload/route.ts](src/app/api/pinata/upload/route.ts#L1-L31).

Notes & important behaviors
---------------------------
- TUS logic and polling: `extractCid()` in [src/lib/tusUpload.ts](src/lib/tusUpload.ts#L1-L109) polls `/api/pinata/file-info` several times (with backoff) because Pinata may take a moment to assign the CID.
- `usePendingMints` polls `file-info` for pending uploads and finalizes mints once the CID is available: [src/hooks/usePendingMints.ts](src/hooks/usePendingMints.ts#L1-L92).
- Authorization: server-side routes use `process.env.PINATA_JWT` when calling Pinata's API (see the JWT and upload endpoints linked above).

If you want, I can:
- Add examples of the client call to `POST /api/pinata/signed-upload-url` and the minimal `tus-js-client` usage.
- Expand this doc into a developer guide with code snippets copied from the repo.
