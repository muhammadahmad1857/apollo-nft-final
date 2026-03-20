import { NextRequest, NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");

  if (!fileId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const headers = { Authorization: `Bearer ${process.env.PINATA_JWT}` };

  try {
    // --- Path 1: fileId looks like a real Pinata UUID ---
    if (UUID_RE.test(fileId)) {
      const res = await fetch(`https://api.pinata.cloud/v3/files/${fileId}`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        const cid = data?.data?.cid;
        if (cid) return NextResponse.json({ cid });
      }

      return NextResponse.json({ error: "CID not available yet" }, { status: 404 });
    }

    // --- Path 2: fileId is actually the filename (Pinata TUS uses filename in URL) ---
    // Search by name (Pinata v3 uses `limit`, not `pageSize`)
    const searchRes = await fetch(
      `https://api.pinata.cloud/v3/files?name=${encodeURIComponent(fileId)}&limit=5`,
      { headers }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("[file-info] Pinata search error:", errText);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    const searchData = await searchRes.json();
    const cid = searchData?.data?.files?.[0]?.cid;
    if (cid) return NextResponse.json({ cid });

    // Fallback: name search returned nothing — list recent files and match by name
    const recentRes = await fetch(
      `https://api.pinata.cloud/v3/files?limit=10`,
      { headers }
    );
    if (recentRes.ok) {
      const recentData = await recentRes.json();
      const files: Array<{ name: string; cid: string; id: string }> = recentData?.data?.files ?? [];
      console.log("[file-info] recent files:", JSON.stringify(files.map(f => ({ name: f.name, cid: f.cid, id: f.id }))));
      const match = files.find(f => f.name === fileId || f.name?.endsWith(`/${fileId}`));
      if (match?.cid) return NextResponse.json({ cid: match.cid });
    }

    return NextResponse.json({ error: "CID not available yet" }, { status: 404 });
  } catch (err) {
    console.error("[file-info] Exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
