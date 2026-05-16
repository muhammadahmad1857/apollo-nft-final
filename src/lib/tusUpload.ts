import * as tus from "tus-js-client";

export interface TusUploadOptions {
  file: File;
  /** TUS endpoint URL from /api/pinata/signed-upload-url */
  endpoint: string;
  /** Bearer token for Pinata authorization */
  token: string;
  onProgress: (bytesSent: number, bytesTotal: number) => void;
  onSuccess: (cid: string) => void;
  onError: (err: Error) => void;
  /** Called as soon as the TUS session is created and the Pinata file UUID is known — well before upload completes */
  onFileCreated?: (fileId: string, filename: string) => void;
}

export interface TusUploadHandle {
  abort: () => Promise<void>;
}

export function startTusUpload(options: TusUploadOptions): TusUploadHandle {
  console.log(
    `[TUS Upload] Starting upload for file: ${options.file.name} (${options.file.size} bytes, type: ${options.file.type})`
  );
  console.log(`[TUS Upload] Endpoint: ${options.endpoint}`);

  const upload = new tus.Upload(options.file, {
    endpoint: options.endpoint,
    // Always send Authorization header when token is provided (direct-to-Pinata mode)
    headers: options.token ? { Authorization: `Bearer ${options.token}` } : {},
    chunkSize: 50 * 1024 * 1024, // 50 MB — direct to Pinata, no Vercel proxy limit
    retryDelays: [0, 1000, 3000, 5000, 10000],
    metadata: {
      filename: options.file.name,
      filetype: options.file.type || "application/octet-stream",
    },
    onProgress: (bytesSent, bytesTotal) => {
      const percentComplete = Math.round((bytesSent / bytesTotal) * 100);
      console.log(
        `[TUS Upload] Loading... ${percentComplete}% (${bytesSent}/${bytesTotal} bytes)`
      );
      options.onProgress(bytesSent, bytesTotal);
    },
    onChunkComplete: (_chunkSize, _bytesAccepted, _bytesTotal) => {
      // Fire once as soon as the first chunk lands — upload.url is now set and contains the Pinata file UUID
      if (options.onFileCreated && upload.url) {
        const segments = upload.url.split("/").filter(Boolean);
        const uuid = segments.find((s) => UUID_RE.test(s));
        if (uuid) {
          console.log(
            `[TUS Upload] File created on Pinata! UUID: ${uuid} (ready before full upload completes)`
          );
          options.onFileCreated(uuid, options.file.name);
          // Prevent firing again by clearing the callback reference
          options.onFileCreated = undefined;
        }
      }
    },
    onSuccess: async () => {
      console.log(`[TUS Upload] TUS upload complete, extracting CID...`);
      try {
        const cid = await extractCid(upload.url ?? "", options.file.name);
        console.log(`[TUS Upload] SUCCESS! CID resolved: ${cid}`);
        options.onSuccess(cid);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[TUS Upload] FAILED to extract CID: ${errMsg}`);
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onError: (err) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[TUS Upload] UPLOAD ERROR: ${errMsg}`);
      options.onError(err instanceof Error ? err : new Error(String(err)));
    },
    storeFingerprintForResuming: false,
  });

  upload.start();
  console.log(`[TUS Upload] Upload session started`);

  return {
    abort: () => upload.abort(true),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * After a TUS upload completes, Pinata's upload URL contains the file ID.
 * We call our server-side /api/pinata/file-info to exchange it for the IPFS CID.
 *
 * upload.url is our proxy URL: /api/pinata/tus/{uuid}/{filename}
 * OR the original Pinata URL: https://uploads.pinata.cloud/v3/files/{uuid}/{filename}
 *
 * In both cases the UUID segment IS the Pinata file ID → direct UUID lookup in file-info.
 */
async function extractCid(uploadUrl: string, filename?: string): Promise<string> {
  console.log(`[CID Extraction] Starting CID extraction from: ${uploadUrl}`);
  const segments = uploadUrl.split("/").filter(Boolean);
  const uuidIdx = segments.findIndex((s) => UUID_RE.test(s));

  let fileId: string;
  if (uuidIdx !== -1) {
    // UUID is the Pinata file ID — use it for a direct /v3/files/{uuid} lookup
    fileId = segments[uuidIdx]!;
    console.log(`[CID Extraction] Extracted file ID (UUID): ${fileId}`);
  } else {
    // No UUID in URL — fall back to filename-based search
    fileId = segments[segments.length - 1] ?? "";
    console.log(`[CID Extraction] Using fallback file ID from URL: ${fileId}`);
  }

  if (!fileId) {
    const errMsg = `Cannot extract file ID from TUS upload URL: ${uploadUrl}`;
    console.error(`[CID Extraction] FAILED: ${errMsg}`);
    throw new Error(errMsg);
  }

  // Poll up to 10 times (Pinata may take a moment to assign the CID)
  const filenameParam = filename ? `&filename=${encodeURIComponent(filename)}` : "";
  for (let attempt = 0; attempt < 10; attempt++) {
    console.log(`[CID Extraction] Polling attempt ${attempt + 1}/10 for file-info...`);
    try {
      const res = await fetch(`/api/pinata/file-info?id=${fileId}${filenameParam}`);
      if (res.ok) {
        const data = (await res.json()) as { cid?: string };
        if (data.cid) {
          console.log(`[CID Extraction] SUCCESS! CID resolved on attempt ${attempt + 1}: ${data.cid}`);
          return data.cid;
        }
        console.log(
          `[CID Extraction] Attempt ${attempt + 1}: Response OK but no CID yet (Pinata still processing)`
        );
      } else {
        console.warn(
          `[CID Extraction] Attempt ${attempt + 1}: HTTP ${res.status} - ${res.statusText}`
        );
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[CID Extraction] Attempt ${attempt + 1}: Fetch error: ${errMsg}`);
    }

    if (attempt < 9) {
      const waitMs = 2000 * (attempt + 1);
      console.log(`[CID Extraction] Waiting ${waitMs}ms before next retry...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  const errMsg = "CID not available after upload — Pinata may still be processing";
  console.error(`[CID Extraction] FAILED after all attempts: ${errMsg}`);
  throw new Error(errMsg);
}
