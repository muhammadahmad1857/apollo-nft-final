import { NextResponse } from "next/server";

const PINATA_TUS_ENDPOINT = "https://uploads.pinata.cloud/v3/files";
/** Pinata hard per-file limit (docs: 25 GB). App default cap matches that. */
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024 * 1024;

/**
 * Returns credentials for direct browser → Pinata TUS uploads.
 *
 * Prefer presigned URLs without max_file_size — signing an exact byte cap
 * causes Pinata to return 413 "Upload-Length exceeds maximum upload size"
 * on large files even when the cap matches the file.
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

    if (typeof fileSize !== "number" || fileSize <= 0) {
      return NextResponse.json(
        { error: "fileSize is required (bytes)" },
        { status: 400 }
      );
    }

    if (fileSize > maxAllowed) {
      return NextResponse.json(
        {
          error: "File exceeds upload limit",
          maxBytes: maxAllowed,
          fileSize,
        },
        { status: 400 }
      );
    }

    if (!process.env.PINATA_JWT) {
      return NextResponse.json({ error: "Pinata not configured" }, { status: 500 });
    }

    const signPayload: Record<string, unknown> = {
      network: "public",
      date: Math.floor(Date.now() / 1000),
      expires: 14400,
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

    if (signRes.ok) {
      const signData = (await signRes.json()) as { data?: string };
      if (signData.data) {
        return NextResponse.json({
          data: {
            url: signData.data,
            token: "",
          },
        });
      }
    } else {
      const errText = await signRes.text();
      console.error("[signed-upload-url] presign failed:", signRes.status, errText);
    }

    // Fallback: short-lived scoped JWT for direct TUS to the collection endpoint
    const jwtRes = await fetch("https://api.pinata.cloud/v3/api_keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        keyname: `TUS-Upload-${Date.now()}${body.filename ? `-${body.filename}` : ""}`,
        permissions: { admin: true },
        maxUses: 10,
      }),
    });

    if (!jwtRes.ok) {
      const errText = await jwtRes.text();
      console.error("[signed-upload-url] JWT creation error:", jwtRes.status, errText);
      return NextResponse.json(
        { error: "Failed to create upload credentials", details: errText },
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
