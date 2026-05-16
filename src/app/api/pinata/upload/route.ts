import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log(`[Pin CID] Request received`);
  try {
    const { cid } = await req.json();
    console.log(`[Pin CID] CID to pin: ${cid}`);

    if (!cid) {
      console.error(`[Pin CID] FAILED: CID is required`);
      return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }

    console.log(`[Pin CID] Calling Pinata to pin by hash...`);
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

    if (!pinRes.ok) {
      console.error(`[Pin CID] FAILED: HTTP ${pinRes.status} - ${JSON.stringify(data).slice(0, 200)}`);
      return NextResponse.json(data, { status: pinRes.status });
    }

    console.log(`[Pin CID] SUCCESS! CID pinned: ${cid}`);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Pin CID] FAILED with exception: ${errMsg}`);
    return NextResponse.json({ error: "Failed to pin CID" }, { status: 500 });
  }
}
