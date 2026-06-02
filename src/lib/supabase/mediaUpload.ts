import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildSupabaseObjectPath,
  getSupabasePublicUrl,
  isSupabaseStorageUrl,
  SUPABASE_MAX_UPLOAD_BYTES,
  SUPABASE_MEDIA_BUCKET,
} from "@/lib/supabase/config";
import { formatBytes } from "@/lib/formatBytes";

export interface SupabaseUploadResult {
  publicUrl: string;
  path: string;
  bucket: string;
}

export async function uploadSupabaseMediaFile(file: File, kind: "video" | "trailer") {
  if (file.size > SUPABASE_MAX_UPLOAD_BYTES) {
    throw new Error(
      `Supabase uploads are limited to 15GB. Your file is ${formatBytes(file.size)}.`
    );
  }

  const response = await fetch("/api/supabase/storage-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, kind }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to create Supabase upload URL");
  }

  const payload = (await response.json()) as {
    bucket: string;
    path: string;
    token: string;
    publicUrl: string;
  };

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(payload.bucket)
    .uploadToSignedUrl(payload.path, payload.token, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    bucket: payload.bucket,
    path: payload.path,
    publicUrl: payload.publicUrl,
  } satisfies SupabaseUploadResult;
}

export function makeSupabaseMediaUrl(kind: "video" | "trailer", filename: string) {
  const path = buildSupabaseObjectPath(kind, filename);
  return {
    bucket: SUPABASE_MEDIA_BUCKET,
    path,
    publicUrl: getSupabasePublicUrl(SUPABASE_MEDIA_BUCKET, path),
  };
}

export { isSupabaseStorageUrl };