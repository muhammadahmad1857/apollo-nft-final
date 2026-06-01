export const SUPABASE_MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET ??
  process.env.SUPABASE_MEDIA_BUCKET ??
  "apollo-media";

export const SUPABASE_TRAILER_FOLDER = "trailers";
export const SUPABASE_VIDEO_FOLDER = "videos";

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("Supabase URL is not configured");
  }
  return url.replace(/\/$/, "");
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Supabase anon key is not configured");
  }
  return key;
}

export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Supabase service role key is not configured");
  }
  return key;
}

export function isSupabaseStorageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("supabase.co/storage/v1/object/");
}

export function getSupabasePublicUrl(bucket: string, path: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path}`;
}

export function sanitizeSupabasePathSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file";
}

export function buildSupabaseObjectPath(kind: "video" | "trailer", filename: string): string {
  const cleanName = sanitizeSupabasePathSegment(filename);
  const folder = kind === "trailer" ? SUPABASE_TRAILER_FOLDER : SUPABASE_VIDEO_FOLDER;
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;
}