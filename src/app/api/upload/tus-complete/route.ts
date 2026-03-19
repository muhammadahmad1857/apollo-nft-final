import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { FileUploadStatus, FileRole, NftReadinessStatus } from "@/generated/prisma/enums";

export async function POST(req: NextRequest) {
  try {
    const { fileId, pinataUploadUrl } = (await req.json()) as {
      fileId: string;
      pinataUploadUrl: string;
    };

    if (!fileId?.trim()) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    if (!pinataUploadUrl?.trim()) {
      return NextResponse.json({ error: "pinataUploadUrl is required" }, { status: 400 });
    }

    // Extract Pinata file ID from the TUS upload URL
    // TUS URL format: https://uploads.pinata.cloud/v3/files/{pinataFileId}
    const pinataFileId = pinataUploadUrl.split("/").pop()?.split("?")[0];
    if (!pinataFileId) {
      return NextResponse.json({ error: "Invalid Pinata upload URL" }, { status: 400 });
    }

    // Fetch file info from Pinata Files API to get the IPFS CID
    const pinataRes = await fetch(`https://api.pinata.cloud/v3/files/${pinataFileId}`, {
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    });

    if (!pinataRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file info from Pinata: ${pinataRes.status}` },
        { status: 500 }
      );
    }

    const pinataData = (await pinataRes.json()) as { data?: { cid?: string } };
    const cid = pinataData?.data?.cid;

    if (!cid) {
      return NextResponse.json({ error: "No CID in Pinata response" }, { status: 500 });
    }

    const ipfsUrl = `ipfs://${cid}`;

    // Update File record
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

    return NextResponse.json({ success: true, ipfsUrl });
  } catch (error) {
    console.error("POST /api/upload/tus-complete error:", error);
    return NextResponse.json({ error: "Failed to complete TUS upload" }, { status: 500 });
  }
}
