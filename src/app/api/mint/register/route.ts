import { NextRequest, NextResponse } from "next/server";
import { NftReadinessStatus, FileUploadStatus, FileRole } from "@/generated/prisma/enums";
import { db } from "@/lib/prisma";

interface RegisterMintPayload {
  tokenId: number;
  walletAddress: string;
  tokenUri: string;
  name?: string;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  musicTrackUrl?: string;
  fileType?: string;
  trailerUrl?: string;
  trailerFileType?: string;
  royaltyBps?: number;
  mainFileId?: string;
  coverFileId?: string;
  trailerFileId?: string;
}

function resolveReadiness(musicTrackUrl?: string): NftReadinessStatus {
  if (!musicTrackUrl || musicTrackUrl.trim() === "") {
    return NftReadinessStatus.PROCESSING;
  }

  return NftReadinessStatus.READY;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as RegisterMintPayload;

    if (!Number.isFinite(payload.tokenId)) {
      return NextResponse.json({ error: "tokenId is required" }, { status: 400 });
    }

    if (!payload.walletAddress?.trim()) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    if (!payload.tokenUri?.trim()) {
      return NextResponse.json({ error: "tokenUri is required" }, { status: 400 });
    }

    const walletAddress = payload.walletAddress.trim();

    const user = await db.user.findUnique({
      where: { walletAddress },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const readinessStatus = resolveReadiness(payload.musicTrackUrl);

    const nft = await db.nFT.upsert({
      where: {
        tokenId: payload.tokenId,
      },
      create: {
        tokenId: payload.tokenId,
        name: payload.name?.trim() || payload.title?.trim() || "Untitled",
        title: payload.title?.trim() || "Untitled",
        description: payload.description?.trim() || "",
        imageUrl: payload.coverImageUrl || "",
        mediaUrl: payload.musicTrackUrl || "",
        fileType: payload.fileType || "",
        trailer: payload.trailerUrl || null,
        trailerFileType: payload.trailerFileType || null,
        tokenUri: payload.tokenUri,
        royaltyBps: payload.royaltyBps ?? 0,
        mintPrice: 0,
        isListed: false,
        readinessStatus,
        creatorId: user.id,
        ownerId: user.id,
      },
      update: {
        name: payload.name?.trim() || undefined,
        title: payload.title?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        imageUrl: payload.coverImageUrl || undefined,
        mediaUrl: payload.musicTrackUrl || undefined,
        fileType: payload.fileType || undefined,
        trailer: payload.trailerUrl || null,
        trailerFileType: payload.trailerFileType || null,
        tokenUri: payload.tokenUri,
        royaltyBps: payload.royaltyBps ?? undefined,
        readinessStatus,
      },
      select: {
        id: true,
        tokenId: true,
        readinessStatus: true,
      },
    });

    // Link file records to the NFT and patch media fields for already-completed uploads
    const fileIdsByRole: Array<{ fileId: string; role: FileRole }> = [
      payload.mainFileId ? { fileId: payload.mainFileId, role: FileRole.MAIN } : null,
      payload.coverFileId ? { fileId: payload.coverFileId, role: FileRole.COVER } : null,
      payload.trailerFileId ? { fileId: payload.trailerFileId, role: FileRole.TRAILER } : null,
    ].filter((x): x is { fileId: string; role: FileRole } => x !== null);

    for (const { fileId, role } of fileIdsByRole) {
      const file = await db.file.update({
        where: { id: fileId },
        data: { nftId: nft.id },
        select: { uploadStatus: true, ipfsUrl: true },
      }).catch(() => null);

      // If the upload already completed before minting, patch NFT media field now
      if (file?.uploadStatus === FileUploadStatus.COMPLETED && file.ipfsUrl) {
        if (role === FileRole.MAIN) {
          await db.nFT.update({ where: { id: nft.id }, data: { mediaUrl: file.ipfsUrl, readinessStatus: NftReadinessStatus.READY } });
        } else if (role === FileRole.COVER) {
          await db.nFT.update({ where: { id: nft.id }, data: { imageUrl: file.ipfsUrl } });
        } else if (role === FileRole.TRAILER) {
          await db.nFT.update({ where: { id: nft.id }, data: { trailer: file.ipfsUrl } });
        }
      }
    }

    return NextResponse.json({ success: true, nft });
  } catch (error) {
    console.error("POST /api/mint/register error:", error);
    return NextResponse.json({ error: "Failed to register mint state" }, { status: 500 });
  }
}
