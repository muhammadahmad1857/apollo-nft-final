import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pendingMint = await db.pendingMint.findUnique({ where: { id } });
    if (!pendingMint) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ pendingMint });
  } catch (err) {
    console.error("[pending-mints GET by id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, mediaUrl, metadataUrl } = body as {
      status?: string;
      mediaUrl?: string;
      metadataUrl?: string;
    };

    const pending = await db.pendingMint.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(mediaUrl && { mediaUrl }),
        ...(metadataUrl && { metadataUrl }),
      },
    });

    return NextResponse.json({ pending });
  } catch (err) {
    console.error("[pending-mints PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
