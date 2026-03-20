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
}

export interface TusUploadHandle {
  abort: () => Promise<void>;
}

export function startTusUpload(options: TusUploadOptions): TusUploadHandle {
  const upload = new tus.Upload(options.file, {
    endpoint: options.endpoint,
    headers: {
      Authorization: `Bearer ${options.token}`,
    },
    chunkSize: 50 * 1024 * 1024, // 50 MB chunks
    retryDelays: [0, 1000, 3000, 5000, 10000],
    metadata: {
      filename: options.file.name,
      filetype: options.file.type || "application/octet-stream",
    },
    onProgress: options.onProgress,
    onSuccess: async () => {
      try {
        const cid = await extractCid(upload.url ?? "");
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
 * Pinata v3 TUS URL formats:
 *   https://uploads.pinata.cloud/v3/files/{session-uuid}/{filename}
 *     → session-uuid is NOT the file's UUID in the Files API; use filename for name search
 *   https://uploads.pinata.cloud/v3/files/{filename}
 *     → use filename for name search
 *   https://uploads.pinata.cloud/v3/files/{file-uuid}
 *     → UUID is the last segment; use it for direct lookup
 */
async function extractCid(uploadUrl: string): Promise<string> {
  const segments = uploadUrl.split("/").filter(Boolean);
  const uuidIdx = segments.findIndex((s) => UUID_RE.test(s));

  let fileId: string;
  if (uuidIdx !== -1 && uuidIdx < segments.length - 1) {
    // UUID followed by filename — session UUID, not file UUID; use filename
    fileId = segments[segments.length - 1]!;
  } else if (uuidIdx !== -1) {
    // UUID is the last segment — direct file lookup
    fileId = segments[uuidIdx]!;
  } else {
    // No UUID — last segment is the filename
    fileId = segments[segments.length - 1] ?? "";
  }

  if (!fileId) {
    throw new Error(`Cannot extract file ID from TUS upload URL: ${uploadUrl}`);
  }

  // Poll up to 10 times (Pinata may take a moment to assign the CID)
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch(`/api/pinata/file-info?id=${fileId}`);
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
