import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const walletAddress = req.nextUrl.searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { walletAddress } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const favorites = await db.nFTLike.findMany({
      where: { userId: user.id },
      include: {
        nft: {
          include: {
            owner: true,
            creator: true,
            likes: true,
            auction: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
