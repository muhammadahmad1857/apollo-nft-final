import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient, getSupabaseMediaBucket } from "@/lib/supabase/server";
import { buildSupabaseObjectPath, getSupabasePublicUrl } from "@/lib/supabase/config";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      filename?: string;
      kind?: "video" | "trailer";
    };

    if (!body.filename || !body.kind) {
      return NextResponse.json({ error: "filename and kind are required" }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const bucket = getSupabaseMediaBucket();
    const path = buildSupabaseObjectPath(body.kind, body.filename);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create Supabase upload URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      bucket,
      path,
      token: data.token,
      publicUrl: getSupabasePublicUrl(bucket, path),
    });
  } catch (error) {
    console.error("[supabase storage-upload-url]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}