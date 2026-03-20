import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");

  if (!fileId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.pinata.cloud/v3/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[file-info] Pinata error:", errText);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const data = await res.json();
    // Pinata v3 response shape: { data: { cid: "Qm...", ... } }
    const cid = data?.data?.cid;

    if (!cid) {
      return NextResponse.json({ error: "CID not available yet" }, { status: 404 });
    }

    return NextResponse.json({ cid });
  } catch (err) {
    console.error("[file-info] Exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
