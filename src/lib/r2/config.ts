export const R2_MAX_UPLOAD_BYTES = 15 * 1024 * 1024 * 1024;
export const R2_MULTIPART_CHUNK_BYTES = 64 * 1024 * 1024;

export const R2_VIDEO_FOLDER = "videos";
export const R2_TRAILER_FOLDER = "trailers";

export function getR2BucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME ?? process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2 bucket name is not configured");
  }
  return bucket;
}

export function getR2AccountId(): string {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("R2 account ID is not configured");
  }
  return accountId;
}

export function getR2AccessKeyId(): string {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  if (!accessKeyId) {
    throw new Error("R2 access key ID is not configured");
  }
  return accessKeyId;
}

export function getR2SecretAccessKey(): string {
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!secretAccessKey) {
    throw new Error("R2 secret access key is not configured");
  }
  return secretAccessKey;
}

export function getR2PublicBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("R2 public URL is not configured");
  }
  return publicUrl.replace(/\/$/, "");
}

export function sanitizeR2PathSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file";
}

export function buildR2ObjectPath(kind: "video" | "trailer", filename: string): string {
  const cleanName = sanitizeR2PathSegment(filename);
  const folder = kind === "trailer" ? R2_TRAILER_FOLDER : R2_VIDEO_FOLDER;
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;
}

export function getR2PublicUrl(key: string): string {
  return `${getR2PublicBaseUrl()}/${key}`;
}