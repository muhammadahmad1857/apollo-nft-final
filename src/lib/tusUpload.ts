import * as tus from "tus-js-client";
import { toast } from "sonner";

// Pinata max file size limit (adjust based on your plan)
const MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024; // 2 GB

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

  // Validate file size
  if (options.file.size > MAX_FILE_SIZE) {
    const maxSizeGB = (MAX_FILE_SIZE / (1024 * 1024 * 1024)).toFixed(1);
    const fileSizeGB = (options.file.size / (1024 * 1024 * 1024)).toFixed(2);
    const errMsg = `File size (${fileSizeGB} GB) exceeds maximum allowed size (${maxSizeGB} GB)`;
    console.error(`[TUS Upload] VALIDATION FAILED: ${errMsg}`);
    const uploadToastId = toast.error(`File too large`, {
      description: errMsg,
    });
    const err = new Error(errMsg);
    options.onError(err);
    return {
      abort: () => Promise.resolve(),
    };
  }

  let isConnectionError = false;
  let uploadToastId: string | number | undefined;
  let connectionCheckInterval: NodeJS.Timeout | null = null;

  const upload = new tus.Upload(options.file, {
    endpoint: options.endpoint,
    // Always send Authorization header when token is provided (direct-to-Pinata mode)
    headers: options.token ? { Authorization: `Bearer ${options.token}` } : {},
    chunkSize: 10 * 1024 * 1024, // 10 MB — direct to Pinata, no Vercel proxy limit
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
      // Clear connection error state on successful chunk
      if (isConnectionError) {
        isConnectionError = false;
        console.log(`[TUS Upload] Connection recovered! Resuming upload...`);
        toast.success(`Upload resumed`, {
          description: `Connection restored, continuing upload...`,
        });
      }

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
      if (connectionCheckInterval) clearInterval(connectionCheckInterval);
      console.log(`[TUS Upload] TUS upload complete, extracting CID...`);
      toast.loading(`Resolving IPFS CID...`, { id: uploadToastId });
      try {
        const cid = await extractCid(upload.url ?? "", options.file.name);
        console.log(`[TUS Upload] SUCCESS! CID resolved: ${cid}`);
        toast.success(`Upload complete!`, {
          id: uploadToastId,
          description: `File successfully uploaded to IPFS`,
        });
        options.onSuccess(cid);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[TUS Upload] FAILED to extract CID: ${errMsg}`);
        toast.error(`CID resolution failed`, {
          id: uploadToastId,
          description: errMsg,
        });
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onError: (err) => {
      if (connectionCheckInterval) clearInterval(connectionCheckInterval);

      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[TUS Upload] UPLOAD ERROR: ${errMsg}`);

      // Detect file too large error (413)
      const isFileTooLarge =
        errMsg.includes("response code: 413") ||
        errMsg.includes("413") ||
        errMsg.includes("exceeds maximum upload size") ||
        errMsg.includes("Payload Too Large");

      if (isFileTooLarge) {
        console.error(`[TUS Upload] File size exceeds Pinata's limit`);
        toast.error(`File too large`, {
          id: uploadToastId,
          description: `This file exceeds Pinata's maximum upload size limit. Try a smaller file or split into multiple uploads.`,
        });
        options.onError(err instanceof Error ? err : new Error(String(err)));
        return;
      }

      // Detect connection errors
      const isNetworkError =
        errMsg.includes("NetworkError") ||
        errMsg.includes("Failed to fetch") ||
        errMsg.includes("timeout") ||
        errMsg.includes("ERR_INTERNET_DISCONNECTED") ||
        errMsg.includes("ECONNREFUSED") ||
        errMsg.includes("ENOTFOUND");

      if (isNetworkError) {
        isConnectionError = true;
        console.log(
          `[TUS Upload] Connection error detected. Resuming when connection recovers...`
        );

        toast.error(`Connection lost`, {
          id: uploadToastId,
          description: `Upload paused. Will resume automatically when connection is restored...`,
        });
        uploadToastId = undefined;

        // Monitor connection recovery
        connectionCheckInterval = setInterval(async () => {
          try {
            const check = await fetch("/ping", { method: "HEAD" }).catch(
              () => null
            );
            if (check) {
              console.log(`[TUS Upload] Connection restored! Resuming...`);
              clearInterval(connectionCheckInterval!);
              connectionCheckInterval = null;
              isConnectionError = false;
              upload.start(); // Resume upload
            }
          } catch {
            // Still disconnected
          }
        }, 3000); // Check every 3 seconds
      } else {
        // Non-network error
        toast.error(`Upload failed`, {
          id: uploadToastId,
          description: errMsg,
        });
      }

      options.onError(err instanceof Error ? err : new Error(String(err)));
    },
    storeFingerprintForResuming: true, // Enable resumable uploads
  });

  upload.start();
  uploadToastId = toast.loading(`Uploading ${options.file.name}...`, {
    description: `Preparing upload...`,
  });
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
