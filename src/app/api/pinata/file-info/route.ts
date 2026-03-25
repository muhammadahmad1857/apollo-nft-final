import { NextRequest, NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");
  const filename = req.nextUrl.searchParams.get("filename") ?? undefined;

  console.log(`[file-info] id=${fileId} filename=${filename ?? "(none)"}`);

  if (!fileId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const headers = { Authorization: `Bearer ${process.env.PINATA_JWT}` };

  try {
    if (UUID_RE.test(fileId)) {
      // --- Strategy 1: v3 direct UUID lookup ---
      const res = await fetch(`https://api.pinata.cloud/v3/files/${fileId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const cid = data?.data?.cid;
        if (cid) { console.log(`[file-info] S1 hit cid=${cid}`); return NextResponse.json({ cid }); }
        console.log(`[file-info] S1 found but no CID yet`);
      } else {
        const errText = await res.text();
        console.warn(`[file-info] S1 ${res.status}:`, errText.slice(0, 200));
      }

      // --- Strategy 2: v3 list files, match by ID ---
      const listRes = await fetch(`https://api.pinata.cloud/v3/files?limit=50`, { headers });
      if (listRes.ok) {
        const listData = await listRes.json();
        const files: Array<{ id: string; name: string; cid: string }> = listData?.data?.files ?? [];
        console.log(`[file-info] S2 v3 list returned ${files.length} files`);
        const match = files.find((f) => f.id === fileId);
        if (match?.cid) {
          console.log(`[file-info] S2 hit cid=${match.cid}`);
          return NextResponse.json({ cid: match.cid });
        }
        console.log(`[file-info] S2 no match for ${fileId} in list`);
      } else {
        const errText = await listRes.text();
        console.warn(`[file-info] S2 v3 list ${listRes.status}:`, errText.slice(0, 200));
      }

      // --- Strategy 3: v1 pinList by filename ---
      if (!filename) {
        console.log(`[file-info] S3/S4 skipped — no filename param`);
      } else {
        const v1Res = await fetch(
          `https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=10&metadata%5Bname%5D=${encodeURIComponent(filename)}`,
          { headers }
        );
        if (v1Res.ok) {
          const v1Data = await v1Res.json();
          const rows: Array<{ ipfs_pin_hash: string; metadata?: { name?: string } }> = v1Data?.rows ?? [];
          console.log(`[file-info] S3 v1 pinList returned ${rows.length} rows for name="${filename}"`);
          if (rows.length > 0) console.log(`[file-info] S3 row names:`, rows.map((r) => r.metadata?.name));
          const v1Match = rows.find((r) => r.metadata?.name === filename);
          if (v1Match?.ipfs_pin_hash) {
            console.log(`[file-info] S3 hit cid=${v1Match.ipfs_pin_hash}`);
            return NextResponse.json({ cid: v1Match.ipfs_pin_hash });
          }
        } else {
          const errText = await v1Res.text();
          console.warn(`[file-info] S3 v1 pinList ${v1Res.status}:`, errText.slice(0, 200));
        }

        // --- Strategy 4: v1 pinList recent 20 ---
        const recentRes = await fetch(
          `https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=20&sortBy=date_pinned&sortOrder=DESC`,
          { headers }
        );
        if (recentRes.ok) {
          const recentData = await recentRes.json();
          const rows: Array<{ ipfs_pin_hash: string; metadata?: { name?: string } }> = recentData?.rows ?? [];
          console.log(`[file-info] S4 recent list ${rows.length} rows, names:`, rows.map((r) => r.metadata?.name));
          const match = rows.find((r) => r.metadata?.name === filename);
          if (match?.ipfs_pin_hash) {
            console.log(`[file-info] S4 hit cid=${match.ipfs_pin_hash}`);
            return NextResponse.json({ cid: match.ipfs_pin_hash });
          }
          console.log(`[file-info] S4 no match for filename="${filename}"`);
        } else {
          const errText = await recentRes.text();
          console.warn(`[file-info] S4 recent ${recentRes.status}:`, errText.slice(0, 200));
        }
      }

      console.log(`[file-info] all strategies failed for ${fileId}`);
      return NextResponse.json({ error: "CID not available yet" }, { status: 404 });
    }

    // --- Non-UUID: search by name using v3 ---
    const searchRes = await fetch(
      `https://api.pinata.cloud/v3/files?name=${encodeURIComponent(fileId)}&limit=5`,
      { headers }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const cid = searchData?.data?.files?.[0]?.cid;
      if (cid) return NextResponse.json({ cid });
    }

    return NextResponse.json({ error: "CID not available yet" }, { status: 404 });
  } catch (err) {
    console.error("[file-info] Exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
