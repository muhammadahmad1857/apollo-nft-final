import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { FileUploadStatus, FileRole, NftReadinessStatus } from "@/generated/prisma/enums";

export async function POST(req: NextRequest) {
  try {
    const { fileId, ipfsUrl } = (await req.json()) as {
      fileId: string;
      ipfsUrl: string;
    };

    if (!fileId?.trim()) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    if (!ipfsUrl?.trim()) {
      return NextResponse.json({ error: "ipfsUrl is required" }, { status: 400 });
    }

    const file = await db.file.update({
      where: { id: fileId },
      data: {
        ipfsUrl,
        uploadStatus: FileUploadStatus.COMPLETED,
        uploadProgress: 100,
        failureReason: null,
      },
      select: { nftId: true, role: true },
    });

    // Patch NFT media fields if file is already linked to an NFT
    if (file.nftId) {
      if (file.role === FileRole.MAIN) {
        await db.nFT.update({
          where: { id: file.nftId },
          data: { mediaUrl: ipfsUrl, readinessStatus: NftReadinessStatus.READY },
        });
      } else if (file.role === FileRole.COVER) {
        await db.nFT.update({ where: { id: file.nftId }, data: { imageUrl: ipfsUrl } });
      } else if (file.role === FileRole.TRAILER) {
        await db.nFT.update({ where: { id: file.nftId }, data: { trailer: ipfsUrl } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/upload/complete error:", error);
    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 });
  }
}
