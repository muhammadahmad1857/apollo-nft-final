import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { cid } = await req.json();

    if (!cid) return NextResponse.json({ error: "CID is required" }, { status: 400 });

    const pinRes = await fetch("https://api.pinata.cloud/pinning/pinByHash", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hashToPin: cid,
        options: { cidVersion: 1 },
      }),
    });

    const data = await pinRes.json();

    if (!pinRes.ok) return NextResponse.json(data, { status: pinRes.status });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Pin CID error:", err);
    return NextResponse.json({ error: "Failed to pin CID" }, { status: 500 });
  }
}
