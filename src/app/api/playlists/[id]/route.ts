import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const playlistId = Number(id);
    const walletAddress = req.nextUrl.searchParams.get("walletAddress");

    if (!walletAddress || Number.isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { walletAddress } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const playlist = await db.playlist.findFirst({
      where: { id: playlistId, userId: user.id },
      include: {
        items: {
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
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error("GET /api/playlists/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
