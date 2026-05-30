import { NextResponse } from "next/server";

/**
 * Returns a Pinata presigned TUS upload URL so the browser uploads directly
 * to uploads.pinata.cloud — avoids Vercel's ~4.5 MB serverless body limit.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      filename?: string;
      maxFileSize?: number;
    };

    const maxFileSize =
      typeof body.maxFileSize === "number"
        ? body.maxFileSize
        : 15 * 1024 * 1024 * 1024;

    const signPayload: Record<string, unknown> = {
      network: "public",
      date: Math.floor(Date.now() / 1000),
      // Large videos may take a while — allow 4 hours to finish uploading
      expires: 14400,
      max_file_size: maxFileSize,
    };

    if (body.filename) {
      signPayload.filename = body.filename;
    }

    const signRes = await fetch("https://uploads.pinata.cloud/v3/files/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify(signPayload),
    });

    if (!signRes.ok) {
      const errText = await signRes.text();
      console.error("[signed-upload-url] Pinata sign error:", signRes.status, errText);
      return NextResponse.json(
        { error: "Failed to create signed upload URL", details: errText },
        { status: signRes.status }
      );
    }

    const signData = (await signRes.json()) as { data?: string };
    const signedUrl = signData.data;

    if (!signedUrl) {
      return NextResponse.json(
        { error: "No signed URL in Pinata response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      data: {
        url: signedUrl,
        token: "",
      },
    });
  } catch (err) {
    console.error("[signed-upload-url] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
