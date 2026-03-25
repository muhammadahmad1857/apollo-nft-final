import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");
    if (!wallet) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }

    const pendingMints = await db.pendingMint.findMany({
      where: {
        walletAddress: wallet,
        status: { not: "minted" },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pendingMints });
  } catch (err) {
    console.error("[pending-mints GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      walletAddress,
      pinataFileId,
      pinataFilename,
      name,
      title,
      description,
      coverImageUrl,
      fileType,
      trailerUrl,
      trailerFileType,
      royaltyBps,
    } = body as {
      walletAddress: string;
      pinataFileId: string;
      pinataFilename?: string;
      name: string;
      title: string;
      description: string;
      coverImageUrl?: string;
      fileType: string;
      trailerUrl?: string;
      trailerFileType?: string;
      royaltyBps: number;
    };

    if (!walletAddress || !pinataFileId || !name || !title || !fileType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pending = await db.pendingMint.create({
      data: {
        walletAddress,
        pinataFileId,
        pinataFilename,
        name,
        title,
        description: description ?? "",
        coverImageUrl,
        fileType,
        trailerUrl,
        trailerFileType,
        royaltyBps: royaltyBps ?? 500,
      },
    });

    return NextResponse.json({ pending }, { status: 201 });
  } catch (err) {
    console.error("[pending-mints POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
