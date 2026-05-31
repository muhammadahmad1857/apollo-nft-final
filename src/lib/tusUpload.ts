// import * as tus from "tus-js-client";

// export interface TusUploadOptions {
//   file: File;
//   /** TUS endpoint URL from /api/pinata/signed-upload-url */
//   endpoint: string;
//   /** Bearer token for Pinata authorization */
//   token: string;
//   onProgress: (bytesSent: number, bytesTotal: number) => void;
//   onSuccess: (cid: string) => void;
//   onError: (err: Error) => void;
//   /** Called as soon as the TUS session is created and the Pinata file UUID is known — well before upload completes */
//   onFileCreated?: (fileId: string, filename: string) => void;
// }

// export interface TusUploadHandle {
//   abort: () => Promise<void>;
// }

// function isVercelTusProxy(endpoint: string): boolean {
//   return endpoint.startsWith("/") || endpoint.includes("/api/pinata/tus");
// }

// /** Pinata presigned URLs embed auth in query params — no Bearer header. */
// function isPinataPresignedUrl(url: string): boolean {
//   return (
//     url.includes("uploads.pinata.cloud") &&
//     (url.includes("X-Signature=") || url.includes("x-signature="))
//   );
// }

// function pinataChunkSize(file: File, viaProxy: boolean): number {
//   if (viaProxy) return 4 * 1024 * 1024;
//   // Pinata docs: chunk must be < 50 MB; use 10 MB for multi-GB files (reliability)
//   if (file.size > 2 * 1024 * 1024 * 1024) return 4 * 1024 * 1024;
//   return 50 * 1024 * 1024;
// }

// export function startTusUpload(options: TusUploadOptions): TusUploadHandle {
//   const viaProxy = isVercelTusProxy(options.endpoint);
//   const presigned = isPinataPresignedUrl(options.endpoint);

//   const uploadOptions: tus.UploadOptions = {
//     uploadSize: options.file.size,
//     chunkSize: pinataChunkSize(options.file, viaProxy),
//     retryDelays: [0, 3000, 5000, 10000, 20000],
//     metadata: {
//       filename: options.file.name,
//       filetype: options.file.type || "application/octet-stream",
//       network: "public",
//     },
//     onProgress: options.onProgress,
//     onChunkComplete: (_chunkSize, _bytesAccepted, _bytesTotal) => {
//       if (options.onFileCreated && upload.url) {
//         const segments = upload.url.split("/").filter(Boolean);
//         const uuid = segments.find((s) => UUID_RE.test(s));
//         if (uuid) {
//           options.onFileCreated(uuid, options.file.name);
//           options.onFileCreated = undefined;
//         }
//       }
//     },
//     onSuccess: async () => {
//       try {
//         const cid = await extractCid(upload.url ?? "", options.file.name);
//         options.onSuccess(cid);
//       } catch (err) {
//         options.onError(err instanceof Error ? err : new Error(String(err)));
//       }
//     },
//     onError: (err) => {
//       options.onError(err instanceof Error ? err : new Error(String(err)));
//     },
//     removeFingerprintOnSuccess: true,
//     storeFingerprintForResuming: true,

//   };

//   uploadOptions.endpoint = options.endpoint;
//   console.log("Options endpoint",options.endpoint)
//   // Presigned URLs embed auth in query params — Bearer header breaks or duplicates auth
//   if (options.token && !presigned) {
//     uploadOptions.headers = { Authorization: `Bearer ${options.token}` };
//   }

//   const upload = new tus.Upload(options.file, uploadOptions);

//   upload.start();

//   return {
//     abort: () => upload.abort(true),
//   };
// }

// const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// /**
//  * After a TUS upload completes, Pinata's upload URL contains the file ID.
//  * We call our server-side /api/pinata/file-info to exchange it for the IPFS CID.
//  */
// async function extractCid(uploadUrl: string, filename?: string): Promise<string> {
//   const segments = uploadUrl.split("/").filter(Boolean);
//   const uuidIdx = segments.findIndex((s) => UUID_RE.test(s));

//   let fileId: string;
//   if (uuidIdx !== -1) {
//     fileId = segments[uuidIdx]!;
//   } else {
//     fileId = segments[segments.length - 1] ?? "";
//   }

//   if (!fileId) {
//     throw new Error(`Cannot extract file ID from TUS upload URL: ${uploadUrl}`);
//   }

//   const filenameParam = filename ? `&filename=${encodeURIComponent(filename)}` : "";
//   for (let attempt = 0; attempt < 10; attempt++) {
//     const res = await fetch(`/api/pinata/file-info?id=${fileId}${filenameParam}`);
//     if (res.ok) {
//       const data = (await res.json()) as { cid?: string };
//       if (data.cid) return data.cid;
//     }

//     if (attempt < 9) {
//       await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
//     }
//   }

//   throw new Error("CID not available after upload — Pinata may still be processing");
// }
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

function getProxyChunkSize(): number {
  const configured = Number(process.env.NEXT_PUBLIC_TUS_PROXY_CHUNK_BYTES);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }

  // Keep chunks small to survive strict reverse-proxy body limits.
  return 256 * 1024;
}

/** Pinata presigned URLs embed auth in query params — no Bearer header. */
function isPinataPresignedUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes("uploads.pinata.cloud") &&
    lowerUrl.includes("x-signature=")
  );
}

function pinataChunkSize(file: File, viaProxy: boolean): number {
  if (viaProxy) return getProxyChunkSize();
  // Keep direct uploads conservative for reliability and simpler 413 troubleshooting.
  if (file.size > 2 * 1024 * 1024 * 1024) return 4 * 1024 * 1024;
  return 8 * 1024 * 1024;
}

export function startTusUpload(options: TusUploadOptions): TusUploadHandle {
  const viaProxy = isVercelTusProxy(options.endpoint);
  const presigned = isPinataPresignedUrl(options.endpoint);

  const uploadOptions: tus.UploadOptions = {
    uploadSize: options.file.size,
    chunkSize: pinataChunkSize(options.file, viaProxy),
    retryDelays: [0, 3000, 5000, 10000, 20000],
    metadata: {
      filename: options.file.name,
      filetype: options.file.type || "application/octet-stream",
      network: "public",
    },
    onProgress: options.onProgress,
    onChunkComplete: () => {
      if (options.onFileCreated && upload.url) {
        const segments = upload.url.split("/").filter(Boolean);
        const uuid = segments.find((s) => UUID_RE.test(s));
        if (uuid) {
          options.onFileCreated(uuid, options.file.name);
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
    removeFingerprintOnSuccess: true,
    storeFingerprintForResuming: true,

  };

  uploadOptions.endpoint = options.endpoint;

  // Presigned URLs embed auth in query params — Bearer header breaks or duplicates auth
  if (options.token && !presigned) {
    uploadOptions.headers = { Authorization: `Bearer ${options.token}` };
  }

  const upload = new tus.Upload(options.file, uploadOptions);

  upload.start();

  return {
    abort: () => upload.abort(true),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * After a TUS upload completes, Pinata's upload URL contains the file ID.
 * We call our server-side /api/pinata/file-info to exchange it for the IPFS CID.
 */
async function extractCid(uploadUrl: string, filename?: string): Promise<string> {
  const segments = uploadUrl.split("/").filter(Boolean);
  const uuidIdx = segments.findIndex((s) => UUID_RE.test(s));

  let fileId: string;
  if (uuidIdx !== -1) {
    fileId = segments[uuidIdx]!;
  } else {
    fileId = segments[segments.length - 1] ?? "";
  }

  if (!fileId) {
    throw new Error(`Cannot extract file ID from TUS upload URL: ${uploadUrl}`);
  }

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
