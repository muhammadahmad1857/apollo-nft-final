import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import path from "path";
import fs from "fs/promises";
import { db } from "@/lib/prisma";
import { FileUploadStatus } from "@/generated/prisma/enums";
import {
  getChunkDir,
  readManifest,
  writeManifest,
  runBackgroundUpload,
} from "@/lib/backgroundUpload";

export const runtime = "nodejs";

// Allow large request bodies (up to 10MB per chunk + overhead)
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  if (!fileId?.trim()) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    // Verify file record exists
    const fileRecord = await db.file.findUnique({
      where: { id: fileId },
      select: { id: true, uploadStatus: true },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }

    if (fileRecord.uploadStatus === FileUploadStatus.COMPLETED) {
      return NextResponse.json({ ok: true, status: "already-completed" });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const chunkBlob = formData.get("chunk") as Blob | null;
    const indexStr = formData.get("index") as string | null;
    const totalStr = formData.get("total") as string | null;

    if (!chunkBlob || indexStr === null || totalStr === null) {
      return NextResponse.json(
        { error: "Missing chunk, index, or total" },
        { status: 400 }
      );
    }

    const chunkIndex = parseInt(indexStr, 10);
    const totalChunks = parseInt(totalStr, 10);

    if (!Number.isFinite(chunkIndex) || !Number.isFinite(totalChunks)) {
      return NextResponse.json({ error: "Invalid index or total" }, { status: 400 });
    }

    // Write chunk to disk
    const chunkDir = getChunkDir(fileId);
    await fs.mkdir(chunkDir, { recursive: true });

    const chunkBuffer = Buffer.from(await chunkBlob.arrayBuffer());
    const chunkFilename = `chunk-${String(chunkIndex).padStart(6, "0")}`;
    await fs.writeFile(path.join(chunkDir, chunkFilename), chunkBuffer);

    // Update manifest
    let manifest = await readManifest(fileId).catch(() => null);
    if (manifest) {
      if (!manifest.receivedChunks.includes(chunkIndex)) {
        manifest.receivedChunks.push(chunkIndex);
      }
      // Update totalChunks in case it differs
      manifest.totalChunks = totalChunks;
    } else {
      // Fallback if manifest somehow missing
      manifest = {
        totalChunks,
        filename: "unknown",
        mimeType: "application/octet-stream",
        walletAddress: "",
        role: "MAIN" as const,
        fileSize: 0,
        receivedChunks: [chunkIndex],
      };
    }
    await writeManifest(fileId, manifest);

    // Update progress in DB (chunk phase = 0–80%)
    const chunkProgress = Math.round(
      ((manifest.receivedChunks.length / totalChunks) * 80)
    );
    await db.file.update({
      where: { id: fileId },
      data: {
        uploadStatus: FileUploadStatus.UPLOADING,
        uploadProgress: chunkProgress,
      },
    });

    // If all chunks received, trigger background Pinata upload
    const isLastChunk = manifest.receivedChunks.length >= totalChunks;
    if (isLastChunk) {
      after(async () => {
        await runBackgroundUpload(fileId);
      });
    }

    return NextResponse.json({
      ok: true,
      chunkIndex,
      receivedCount: manifest.receivedChunks.length,
      totalChunks,
      isLastChunk,
    });
  } catch (error) {
    console.error(`POST /api/upload/chunk/${fileId} error:`, error);
    return NextResponse.json({ error: "Chunk upload failed" }, { status: 500 });
  }
}
