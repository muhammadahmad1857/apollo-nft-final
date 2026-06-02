import {
  buildR2ObjectPath,
  getR2PublicUrl,
  R2_MAX_UPLOAD_BYTES,
  R2_MULTIPART_CHUNK_BYTES,
} from "@/lib/r2/config";
import { formatBytes } from "@/lib/formatBytes";

export interface R2UploadResult {
  publicUrl: string;
  key: string;
  bucket: string;
}

export interface R2UploadProgress {
  (bytesSent: number, bytesTotal: number): void;
}

function putFileToSignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: R2UploadProgress
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      const total = event.lengthComputable ? event.total : file.size;
      onProgress(event.loaded, total);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`R2 upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading to R2"));
    };

    xhr.send(file);
  });
}

function putPartToSignedUrl(
  uploadUrl: string,
  blob: Blob,
  onProgress?: R2UploadProgress,
  bytesBase = 0,
  totalBytes = blob.size
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      const partTotal = event.lengthComputable ? event.total : blob.size;
      onProgress(bytesBase + event.loaded, bytesBase + partTotal);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag") || xhr.getResponseHeader("etag");
        if (!etag) {
          reject(
            new Error(
              "R2 multipart part upload succeeded, but the browser could not read the ETag response header. Add ETag to the bucket CORS ExposeHeaders so multipart completion can work."
            )
          );
          return;
        }
        resolve(etag.replaceAll('"', ""));
        return;
      }

      reject(new Error(`R2 multipart part upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading R2 multipart part"));
    };

    xhr.send(blob);
  });
}

async function requestR2MultipartAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/r2/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to process R2 multipart request");
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function uploadR2MediaFile(
  file: File,
  kind: "video" | "trailer",
  onProgress?: R2UploadProgress
) {
  if (file.size > R2_MAX_UPLOAD_BYTES) {
    throw new Error(
      `Cloudflare R2 uploads are limited to 15GB. Your file is ${formatBytes(file.size)}.`
    );
  }

  const initiate = (await requestR2MultipartAction({
    action: "initiate",
    filename: file.name,
    kind,
    contentType: file.type || "application/octet-stream",
    fileSize: file.size,
  })) as {
    bucket: string;
    key: string;
    uploadId: string;
    partSize: number;
    publicUrl: string;
  };

  const partSize = Math.max(
    5 * 1024 * 1024,
    Math.min(initiate.partSize || R2_MULTIPART_CHUNK_BYTES, file.size)
  );
  const totalParts = Math.ceil(file.size / partSize);
  const uploadedParts: Array<{ etag: string; partNumber: number }> = [];
  let aborted = false;

  try {
    for (let index = 0; index < totalParts; index += 1) {
      const partNumber = index + 1;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      const { uploadUrl } = (await requestR2MultipartAction({
        action: "sign-part",
        key: initiate.key,
        uploadId: initiate.uploadId,
        partNumber,
      })) as { uploadUrl: string };

      const etag = await putPartToSignedUrl(
        uploadUrl,
        blob,
        onProgress,
        start,
        file.size
      );

      uploadedParts.push({ etag, partNumber });
    }

    await requestR2MultipartAction({
      action: "complete",
      key: initiate.key,
      uploadId: initiate.uploadId,
      parts: uploadedParts,
    });

    return {
      bucket: initiate.bucket,
      key: initiate.key,
      publicUrl: initiate.publicUrl,
    } satisfies R2UploadResult;
  } catch (error) {
    aborted = true;
    await requestR2MultipartAction({
      action: "abort",
      key: initiate.key,
      uploadId: initiate.uploadId,
    }).catch(() => undefined);
    throw error;
  } finally {
    if (aborted) {
      // no-op: server-side multipart upload has been aborted above
    }
  }
}

export function makeR2MediaUrl(kind: "video" | "trailer", filename: string) {
  const key = buildR2ObjectPath(kind, filename);
  return {
    key,
    publicUrl: getR2PublicUrl(key),
  };
}