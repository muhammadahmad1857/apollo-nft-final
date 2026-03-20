import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet?.trim()) {
    return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  }

  try {
    // Auto-fix old NFTs that have readinessStatus=PROCESSING but mediaUrl already set
    // (these were created before TUS flow and got PROCESSING as default)
    await db.nFT.updateMany({
      where: {
        readinessStatus: "PROCESSING",
        NOT: { OR: [{ mediaUrl: null }, { mediaUrl: "" }] },
        files: { none: { uploadStatus: { in: ["PENDING", "UPLOADING"] } } },
      },
      data: { readinessStatus: "READY" },
    });

    const nfts = await db.nFT.findMany({
      where: {
        creator: { walletAddress: wallet },
        readinessStatus: { in: ["PROCESSING", "FAILED"] },
      },
      select: {
        id: true,
        tokenId: true,
        title: true,
        imageUrl: true,
        readinessStatus: true,
        files: {
          select: {
            id: true,
            role: true,
            uploadStatus: true,
            uploadProgress: true,
            filename: true,
            failureReason: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ nfts });
  } catch (error) {
    console.error("GET /api/nfts/processing error:", error);
    return NextResponse.json({ error: "Failed to load processing NFTs" }, { status: 500 });
  }
}
