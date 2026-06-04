import { createClient } from "@supabase/supabase-js";
import { SUPABASE_MEDIA_BUCKET, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

export function createSupabaseServiceClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseMediaBucket() {
  return SUPABASE_MEDIA_BUCKET;
}