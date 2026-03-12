import { NextRequest, NextResponse } from "next/server";

const ONE_HOUR_SECONDS = 60 * 60;
const TEN_GB_BYTES = 10 * 1024 * 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;

const DEFAULT_ALLOWED_MIME_TYPES = [
  "audio/*",
  "video/*",
  "image/*",
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const EXACT_ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function isAllowedMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase();
  return (
    normalized.startsWith("audio/") ||
    normalized.startsWith("video/") ||
    normalized.startsWith("image/") ||
    EXACT_ALLOWED_MIME_TYPES.has(normalized)
  );
}

function resolveAllowMimeTypes(mimeType?: string): string[] {
  if (!mimeType) {
    return DEFAULT_ALLOWED_MIME_TYPES;
  }

  const normalized = mimeType.toLowerCase();

  if (normalized.startsWith("audio/")) return ["audio/*"];
  if (normalized.startsWith("video/")) return ["video/*"];
  if (normalized.startsWith("image/")) return ["image/*"];

  return [normalized];
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filename = typeof body?.filename === "string" ? body.filename : undefined;
    const mimeType = typeof body?.mimeType === "string" ? body.mimeType : undefined;
    const fileSize =
      typeof body?.fileSize === "number"
        ? body.fileSize
        : typeof body?.maxFileSize === "number"
          ? body.maxFileSize
          : DEFAULT_MAX_FILE_SIZE;

    if (!filename) {
      return NextResponse.json(
        { error: "Missing filename" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json(
        { error: "Invalid file size" },
        { status: 400 }
      );
    }

    if (fileSize > TEN_GB_BYTES) {
      return NextResponse.json(
        {
          error: "File is too large. Maximum allowed size is 10GB.",
          maxBytes: TEN_GB_BYTES,
        },
        { status: 413 }
      );
    }

    if (mimeType && !isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      date: now,
      expires: ONE_HOUR_SECONDS,
      max_file_size: fileSize,
      allow_mime_types: resolveAllowMimeTypes(mimeType),
      filename,
      keyvalues: { uploadedBy: "nextjs-client" },
    };

    const res = await fetch("https://uploads.pinata.cloud/v3/files/sign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          error: "Failed to generate signed URL",
          details: errText || "Provider rejected request",
        },
        { status: 500 }
      );
    }

    const data = await res.json();
    const url =
      (typeof data?.data === "string" ? data.data : undefined) ||
      data?.data?.url ||
      data?.url ||
      data?.signedUrl;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Signed URL response was missing URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url,
      method: data?.data?.method || data?.method || "POST",
      headers: data?.data?.headers || data?.headers || null,
      fields: data?.data?.fields || data?.fields || null,
      expiresAt: now + ONE_HOUR_SECONDS,
      raw: data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to generate signed URL",
        details: safeErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
