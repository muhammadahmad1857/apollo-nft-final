import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { FileUploadStatus, FileRole } from "@/generated/prisma/enums";
import { getChunkDir, writeManifest, type UploadManifest } from "@/lib/backgroundUpload";
import fs from "fs/promises";

const ALLOWED_ROLES = new Set<string>(["MAIN", "COVER", "TRAILER"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      filename,
      fileSize,
      mimeType,
      role,
      walletAddress,
      totalChunks,
    } = body as {
      filename: string;
      fileSize: number;
      mimeType: string;
      role: string;
      walletAddress: string;
      totalChunks: number;
    };

    if (!filename?.trim()) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }
    if (!walletAddress?.trim()) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }
    if (!Number.isFinite(totalChunks) || totalChunks < 1) {
      return NextResponse.json({ error: "totalChunks must be >= 1" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { walletAddress: walletAddress.trim() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create File record with PENDING status
    const file = await db.file.create({
      data: {
        walletId: walletAddress.trim(),
        ipfsUrl: "",
        type: mimeType || "application/octet-stream",
        filename: filename.trim(),
        isMinted: false,
        role: role as FileRole,
        uploadStatus: FileUploadStatus.PENDING,
        uploadProgress: 0,
      },
    });

    // Create chunk directory and manifest
    const dir = getChunkDir(file.id);
    await fs.mkdir(dir, { recursive: true });

    const manifest: UploadManifest = {
      totalChunks,
      filename: filename.trim(),
      mimeType: mimeType || "application/octet-stream",
      walletAddress: walletAddress.trim(),
      role: role as FileRole,
      fileSize: fileSize || 0,
      receivedChunks: [],
    };
    await writeManifest(file.id, manifest);

    return NextResponse.json({ fileId: file.id });
  } catch (error) {
    console.error("POST /api/upload/start error:", error);
    return NextResponse.json({ error: "Failed to start upload" }, { status: 500 });
  }
}
