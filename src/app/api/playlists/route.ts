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

    const playlists = await db.playlist.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error("GET /api/playlists error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, name } = body as { walletAddress?: string; name?: string };

    if (!walletAddress || !name?.trim()) {
      return NextResponse.json({ error: "walletAddress and name are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { walletAddress } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const playlist = await db.playlist.create({
      data: {
        userId: user.id,
        name: name.trim(),
      },
    });

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error("POST /api/playlists error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
