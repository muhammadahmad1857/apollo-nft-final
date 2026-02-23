import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const playlist = await db.playlist.findFirst({ where: { id: playlistId, userId: user.id } });
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates = Array.isArray(body?.updates) ? body.updates : [];

    await db.$transaction(
      updates.map((update: { id: number; position: number }) =>
        db.playlistItem.update({
          where: { id: update.id },
          data: { position: update.position },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/playlists/[id]/reorder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
