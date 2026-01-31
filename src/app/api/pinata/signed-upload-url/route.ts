import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { filename, maxFileSize = 500 * 1024 * 1024 } = await req.json(); // 500MB default
    console.log("[Pinata] Parsed input:", { filename, maxFileSize });
    const expires = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now

    const payload = {
      date: Math.floor(Date.now() / 1000),
      expires,
      max_file_size: maxFileSize,
      allow_mime_types: ["audio/mpeg", "audio/wav", "video/mp4","image/*"],
      filename,
      keyvalues: { uploadedBy: "nextjs-client" },
    };
    console.log("[Pinata] Built payload:", payload);

    console.log("[Pinata] Sending request to Pinata...");
    const res = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log("[Pinata] Response status:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Pinata] Error response:", errText);
      throw new Error(errText || "Failed to generate signed URL");
    }

    const data = await res.json();
    console.log("[Pinata] Success response:", data);
    // data contains the signed URL and fields
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Pinata] Exception:", err);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
