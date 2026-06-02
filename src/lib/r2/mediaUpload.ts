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

export interface R2MultipartSession {
  bucket: string;
  key: string;
  uploadId: string;
  kind: "video" | "trailer";
  filename: string;
  fileSize: number;
  partSize: number;
  completedParts: Array<{ etag: string; partNumber: number }>;
  createdAt: number;
  updatedAt: number;
}

export interface R2PendingUploadSession {
  storageKey: string;
  kind: "video" | "trailer";
  filename: string;
  fileSize: number;
  percent: number;
}

const R2_SESSION_KEY_PREFIX = "apollo:r2-upload:";
const RETRY_DELAYS_MS = [0, 2000, 5000, 10000, 20000];
const MAX_RETRY_ATTEMPTS = 5;

function getR2SessionStorageKey(file: File, kind: "video" | "trailer") {
  return `${R2_SESSION_KEY_PREFIX}${kind}:${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

function readR2MultipartSession(file: File, kind: "video" | "trailer") {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(getR2SessionStorageKey(file, kind));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as R2MultipartSession;
  } catch {
    window.localStorage.removeItem(getR2SessionStorageKey(file, kind));
    return null;
  }
}

function writeR2MultipartSession(file: File, kind: "video" | "trailer", session: R2MultipartSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getR2SessionStorageKey(file, kind), JSON.stringify(session));
}

function clearR2MultipartSession(file: File, kind: "video" | "trailer") {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getR2SessionStorageKey(file, kind));
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt] ?? 20000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
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
      onProgress(bytesBase + event.loaded, totalBytes);
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
      reject(
        new Error(
          "R2 multipart part upload was blocked by the browser, usually because the bucket CORS policy is missing the exact Origin or does not allow the request headers. Make sure AllowedOrigins matches the app origin exactly and AllowedHeaders includes Content-Type and any x-amz-* headers; ExposeHeaders should include ETag."
        )
      );
    };

    xhr.send(blob);
  });
}

async function requestR2MultipartAction(payload: Record<string, unknown>) {
  return withRetry("R2 multipart API", async () => {
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
  });
}

async function listR2MultipartParts(key: string, uploadId: string) {
  const response = await requestR2MultipartAction({
    action: "list-parts",
    key,
    uploadId,
  });

  return (response.parts as Array<{ partNumber: number; etag: string; size: number }> | undefined) ?? [];
}

export function getR2UploadResumePercent(session: Pick<R2MultipartSession, "fileSize" | "partSize" | "completedParts">) {
  const partSize = Math.max(5 * 1024 * 1024, session.partSize || R2_MULTIPART_CHUNK_BYTES);
  const totalParts = Math.max(1, Math.ceil(session.fileSize / partSize));
  const completed = session.completedParts?.length ?? 0;
  return Math.min(99, Math.round((completed / totalParts) * 100));
}

export function getR2ResumePercentForFile(file: File, kind: "video" | "trailer") {
  const session = readR2MultipartSession(file, kind);
  if (!session) return null;
  return getR2UploadResumePercent(session);
}

export function listPendingR2UploadSessions(kind?: "video" | "trailer"): R2PendingUploadSession[] {
  if (typeof window === "undefined") return [];

  const sessions: R2PendingUploadSession[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey?.startsWith(R2_SESSION_KEY_PREFIX)) continue;

    try {
      const session = JSON.parse(
        window.localStorage.getItem(storageKey) ?? ""
      ) as R2MultipartSession;

      if (kind && session.kind !== kind) continue;

      sessions.push({
        storageKey,
        kind: session.kind,
        filename: session.filename,
        fileSize: session.fileSize,
        percent: getR2UploadResumePercent(session),
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }

  return sessions.sort((left, right) => right.percent - left.percent);
}

export async function discardR2PendingUpload(storageKey: string) {
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return;

  try {
    const session = JSON.parse(raw) as R2MultipartSession;
    await requestR2MultipartAction({
      action: "abort",
      key: session.key,
      uploadId: session.uploadId,
    });
  } catch {
    // Still clear local session if abort fails (e.g. upload already expired).
  }

  window.localStorage.removeItem(storageKey);
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

  const existingSession = readR2MultipartSession(file, kind);

  const initiate = (existingSession ??
    (await requestR2MultipartAction({
      action: "initiate",
      filename: file.name,
      kind,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
    }))) as R2MultipartSession & { publicUrl?: string };

  const partSize = Math.max(
    5 * 1024 * 1024,
    Math.min(initiate.partSize || R2_MULTIPART_CHUNK_BYTES, file.size)
  );
  const totalParts = Math.ceil(file.size / partSize);
  const r2Parts = existingSession ? await listR2MultipartParts(initiate.key, initiate.uploadId) : [];
  const uploadedParts = new Map<number, string>();

  for (const part of existingSession?.completedParts ?? []) {
    uploadedParts.set(part.partNumber, part.etag);
  }

  for (const part of r2Parts) {
    if (part.partNumber > 0 && part.etag) {
      uploadedParts.set(part.partNumber, part.etag.replaceAll('"', ""));
    }
  }

  const persistSession = () => {
    writeR2MultipartSession(file, kind, {
      bucket: initiate.bucket,
      key: initiate.key,
      uploadId: initiate.uploadId,
      kind,
      filename: file.name,
      fileSize: file.size,
      partSize,
      completedParts: Array.from(uploadedParts.entries())
        .sort(([left], [right]) => left - right)
        .map(([partNumber, etag]) => ({ partNumber, etag })),
      createdAt: existingSession?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
  };

  persistSession();

  try {
    for (let index = 0; index < totalParts; index += 1) {
      const partNumber = index + 1;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      if (uploadedParts.has(partNumber)) {
        onProgress?.(end, file.size);
        continue;
      }

      const { uploadUrl } = (await requestR2MultipartAction({
        action: "sign-part",
        key: initiate.key,
        uploadId: initiate.uploadId,
        partNumber,
      })) as { uploadUrl: string };

      const etag = await withRetry(`R2 part ${partNumber}`, () =>
        putPartToSignedUrl(uploadUrl, blob, onProgress, start, file.size)
      );

      uploadedParts.set(partNumber, etag);
      persistSession();
    }

    await requestR2MultipartAction({
      action: "complete",
      key: initiate.key,
      uploadId: initiate.uploadId,
      parts: Array.from(uploadedParts.entries())
        .map(([partNumber, etag]) => ({ partNumber, etag }))
        .sort((left, right) => left.partNumber - right.partNumber),
    });

    clearR2MultipartSession(file, kind);

    return {
      bucket: initiate.bucket,
      key: initiate.key,
      publicUrl: getR2PublicUrl(initiate.key),
    } satisfies R2UploadResult;
  } catch (error) {
    persistSession();
    throw error;
  }
}

export function makeR2MediaUrl(kind: "video" | "trailer", filename: string) {
  const key = buildR2ObjectPath(kind, filename);
  return {
    key,
    publicUrl: getR2PublicUrl(key),
  };
}
