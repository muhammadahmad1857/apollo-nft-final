import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`
  : "https://ipfs.io/ipfs/";

function toGatewayUrl(ipfsUrl: string | null | undefined): string {
  if (!ipfsUrl) return "";
  return ipfsUrl.startsWith("ipfs://") ? ipfsUrl.replace("ipfs://", GATEWAY) : ipfsUrl;
}

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
        ipfsUrl: true,
        role: true,
        nft: {
          select: {
            name: true,
            title: true,
            description: true,
            imageUrl: true,
            mediaUrl: true,
            fileType: true,
            trailer: true,
            trailerFileType: true,
            readinessStatus: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const nft = file.nft;

    // Use the file's ipfsUrl as animation_url if the NFT mediaUrl isn't set yet
    const animationUrl = toGatewayUrl(nft?.mediaUrl || file.ipfsUrl);

    const metadata = {
      name: nft?.title || nft?.name || "Processing...",
      description: nft?.description || "",
      image: toGatewayUrl(nft?.imageUrl),
      animation_url: animationUrl,
      properties: {
        fileType: nft?.fileType || "",
        trailerUrl: toGatewayUrl(nft?.trailer),
        trailerFileType: nft?.trailerFileType || "",
        readinessStatus: nft?.readinessStatus || "PROCESSING",
      },
    };

    return NextResponse.json(metadata, {
      headers: {
        // No caching — metadata evolves as upload completes
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error(`GET /api/nft/metadata/file/${fileId} error:`, error);
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}
