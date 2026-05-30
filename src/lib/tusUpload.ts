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

function isVercelTusProxy(endpoint: string): boolean {
  return endpoint.startsWith("/") || endpoint.includes("/api/pinata/tus");
}

export function startTusUpload(options: TusUploadOptions): TusUploadHandle {
  const viaProxy = isVercelTusProxy(options.endpoint);

  const upload = new tus.Upload(options.file, {
    endpoint: options.endpoint,
    uploadSize: options.file.size,
    // Signed URL mode needs no header; legacy proxy mode also omits client JWT
    headers: options.token ? { Authorization: `Bearer ${options.token}` } : {},
    // Direct Pinata uploads can use 50 MB chunks; proxy must stay under Vercel's 4.5 MB limit
    chunkSize: viaProxy ? 2 * 1024 * 1024 : 50 * 1024 * 1024,
    retryDelays: [0, 1000, 3000, 5000, 10000],
    metadata: {
      filename: options.file.name,
      filetype: options.file.type || "application/octet-stream",
      network: "public",
    },
    onProgress: options.onProgress,
    onChunkComplete: (_chunkSize, _bytesAccepted, _bytesTotal) => {
      // Fire once as soon as the first chunk lands — upload.url is now set and contains the Pinata file UUID
      if (options.onFileCreated && upload.url) {
        const segments = upload.url.split("/").filter(Boolean);
        const uuid = segments.find((s) => UUID_RE.test(s));
        if (uuid) {
          options.onFileCreated(uuid, options.file.name);
          // Prevent firing again by clearing the callback reference
          options.onFileCreated = undefined;
        }
      }
    },
    onSuccess: async () => {
      try {
        const cid = await extractCid(upload.url ?? "", options.file.name);
        options.onSuccess(cid);
      } catch (err) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onError: (err) => {
      options.onError(err instanceof Error ? err : new Error(String(err)));
    },
    storeFingerprintForResuming: false,
  });

  upload.start();

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
  const segments = uploadUrl.split("/").filter(Boolean);
  const uuidIdx = segments.findIndex((s) => UUID_RE.test(s));

  let fileId: string;
  if (uuidIdx !== -1) {
    // UUID is the Pinata file ID — use it for a direct /v3/files/{uuid} lookup
    fileId = segments[uuidIdx]!;
  } else {
    // No UUID in URL — fall back to filename-based search
    fileId = segments[segments.length - 1] ?? "";
  }

  if (!fileId) {
    throw new Error(`Cannot extract file ID from TUS upload URL: ${uploadUrl}`);
  }

  // Poll up to 10 times (Pinata may take a moment to assign the CID)
  const filenameParam = filename ? `&filename=${encodeURIComponent(filename)}` : "";
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch(`/api/pinata/file-info?id=${fileId}${filenameParam}`);
    if (res.ok) {
      const data = (await res.json()) as { cid?: string };
      if (data.cid) return data.cid;
    }

    if (attempt < 9) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }

  throw new Error("CID not available after upload — Pinata may still be processing");
}
