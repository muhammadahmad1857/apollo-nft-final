import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { tokenid: string } }) {
  const { tokenid } = params;
  try {
    const token = await db.nFT.findUnique({
      where: { id: Number(tokenid) },
      include: { owner: true },
    });
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    // Assume token.isListed is a boolean, royaltyBps is a number
    return NextResponse.json({
      id: token.id,
      name: token.name,
      owner: token.owner?.address || "",
      royaltyBps: token.royaltyBps,
      listed: token.isListed,
    });
  } catch (e) {
    return NextResponse.json({ error: "Error fetching token" }, { status: 500 });
  }
}
