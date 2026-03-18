import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const STALE_UPLOAD_HOURS = 4;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId?.trim()) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    const file = await db.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        uploadStatus: true,
        uploadProgress: true,
        ipfsUrl: true,
        failureReason: true,
        role: true,
        filename: true,
        createdAt: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Treat stale UPLOADING records as FAILED
    let { uploadStatus, uploadProgress } = file;
    if (uploadStatus === "UPLOADING") {
      const ageHours =
        (Date.now() - new Date(file.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > STALE_UPLOAD_HOURS) {
        uploadStatus = "FAILED";
        uploadProgress = 0;
      }
    }

    return NextResponse.json({
      fileId: file.id,
      status: uploadStatus,
      progress: uploadProgress,
      ipfsUrl: file.ipfsUrl || null,
      failureReason: file.failureReason || null,
      role: file.role,
      filename: file.filename,
    });
  } catch (error) {
    console.error(`GET /api/upload/status/${fileId} error:`, error);
    return NextResponse.json({ error: "Failed to get upload status" }, { status: 500 });
  }
}
