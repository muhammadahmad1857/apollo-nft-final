import { NextResponse } from "next/server";

const PINATA_TUS_ENDPOINT = "https://uploads.pinata.cloud/v3/files";
/** Pinata hard per-file limit (docs: 25 GB). App default cap matches that. */
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024 * 1024;

/**
 * Returns credentials for direct browser → Pinata TUS uploads.
 *
 * For presigned URLs, max_file_size MUST match the actual file byte length —
 * signing with a higher ceiling (e.g. 15 GB) while uploading 11 GB causes
 * Pinata to reject with 413 "Upload-Length exceeds maximum upload size".
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

    const signPayload: Record<string, unknown> = {
      network: "public",
      date: Math.floor(Date.now() / 1000),
      expires: 14400,
      // Exact byte length — must match TUS Upload-Length
      max_file_size: fileSize,
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

    // Fallback: direct TUS with main JWT (Pinata's standard large-file pattern)
    if (!process.env.PINATA_JWT) {
      return NextResponse.json({ error: "Pinata not configured" }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        url: PINATA_TUS_ENDPOINT,
        token: process.env.PINATA_JWT,
      },
    });
  } catch (err) {
    console.error("[signed-upload-url] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
