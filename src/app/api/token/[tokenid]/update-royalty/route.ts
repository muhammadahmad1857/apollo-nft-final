import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { tokenid: string } }) {
  const { tokenid } = params;
  try {
    const { royaltyBps } = await req.json();
    if (typeof royaltyBps !== "number" || royaltyBps < 0 || royaltyBps > 1000) {
      return NextResponse.json({ error: "Invalid royalty value" }, { status: 400 });
    }
    const token = await db.nFT.update({
      where: { id: Number(tokenid) },
      data: { royaltyBps },
    });
    return NextResponse.json({ success: true, token });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update royalty" }, { status: 500 });
  }
}
