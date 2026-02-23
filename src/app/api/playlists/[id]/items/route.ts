import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

async function resolveUserAndPlaylist(req: NextRequest, id: string) {
  const playlistId = Number(id);
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");

  if (!walletAddress || Number.isNaN(playlistId)) {
    return { error: NextResponse.json({ error: "Invalid request" }, { status: 400 }) };
  }

  const user = await db.user.findUnique({ where: { walletAddress } });
  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const playlist = await db.playlist.findFirst({ where: { id: playlistId, userId: user.id } });
  if (!playlist) {
    return { error: NextResponse.json({ error: "Playlist not found" }, { status: 404 }) };
  }

  return { playlist };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resolved = await resolveUserAndPlaylist(req, id);
    if ("error" in resolved) return resolved.error;

    const { playlist } = resolved;
    const body = await req.json();
    const nftId = Number(body?.nftId);

    if (Number.isNaN(nftId)) {
      return NextResponse.json({ error: "nftId is required" }, { status: 400 });
    }

    const maxPosition = await db.playlistItem.findFirst({
      where: { playlistId: playlist.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const item = await db.playlistItem.create({
      data: {
        playlistId: playlist.id,
        nftId,
        position: (maxPosition?.position ?? -1) + 1,
      },
      include: { nft: true },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/playlists/[id]/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resolved = await resolveUserAndPlaylist(req, id);
    if ("error" in resolved) return resolved.error;

    const playlistId = Number(id);
    const nftId = Number(req.nextUrl.searchParams.get("nftId"));

    if (Number.isNaN(nftId)) {
      return NextResponse.json({ error: "nftId query param is required" }, { status: 400 });
    }

    await db.playlistItem.delete({
      where: {
        playlistId_nftId: {
          playlistId,
          nftId,
        },
      },
    });

    const remaining = await db.playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    for (let index = 0; index < remaining.length; index++) {
      const item = remaining[index];
      await db.playlistItem.update({ where: { id: item.id }, data: { position: index } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/playlists/[id]/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
