import { NextResponse } from "next/server";

const PINATA_TUS_ENDPOINT = "https://uploads.pinata.cloud/v3/files";
const DEFAULT_MAX_BYTES = 15 * 1024 * 1024 * 1024;

/**
 * Returns credentials for direct browser → Pinata TUS uploads.
 * Uses a short-lived scoped JWT (Pinata's recommended TUS pattern) instead of
 * presigned URLs, which can reject uploads when Upload-Length != signed max.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      filename?: string;
      fileSize?: number;
      maxFileSize?: number;
    };

    const fileSize = body.fileSize ?? body.maxFileSize;
    const maxAllowed = Number(process.env.PINATA_MAX_UPLOAD_BYTES) || DEFAULT_MAX_BYTES;

    if (typeof fileSize === "number" && fileSize > maxAllowed) {
      return NextResponse.json(
        {
          error: "File exceeds upload limit",
          maxBytes: maxAllowed,
        },
        { status: 400 }
      );
    }

    const jwtRes = await fetch("https://api.pinata.cloud/v3/api_keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        keyname: `TUS-Upload-${Date.now()}${body.filename ? `-${body.filename}` : ""}`,
        permissions: {
          admin: true,
        },
        maxUses: 10,
      }),
    });

    if (!jwtRes.ok) {
      const errText = await jwtRes.text();
      console.error("[signed-upload-url] JWT creation error:", jwtRes.status, errText);
      return NextResponse.json(
        { error: "Failed to create upload token", details: errText },
        { status: jwtRes.status }
      );
    }

    const jwtData = (await jwtRes.json()) as { JWT?: string; token?: string };
    const uploadToken = jwtData.JWT ?? jwtData.token;

    if (!uploadToken) {
      return NextResponse.json(
        { error: "No upload token in Pinata response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      data: {
        url: PINATA_TUS_ENDPOINT,
        token: uploadToken,
      },
    });
  } catch (err) {
    console.error("[signed-upload-url] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
