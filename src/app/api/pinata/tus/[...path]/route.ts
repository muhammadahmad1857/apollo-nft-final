/**
 * TUS upload proxy — PATCH (upload chunk) + HEAD (check offset)
 *
 * Streams chunk bodies directly to Pinata without buffering,
 * adding PINATA_JWT server-side so the client never sees it.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const PINATA_TUS_BASE = "https://uploads.pinata.cloud/v3/files";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pinataUrl = `${PINATA_TUS_BASE}/${path.join("/")}`;

    const forwardHeaders: Record<string, string> = {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    };

    for (const h of ["Content-Type", "Content-Length", "Upload-Offset", "Tus-Resumable", "Upload-Checksum"]) {
      const v = req.headers.get(h);
      if (v) forwardHeaders[h] = v;
    }

    if (!req.body) {
      return new Response("Missing request body", { status: 400 });
    }

    // Stream the chunk body directly to Pinata — no buffering
    const pinataRes = await fetch(pinataUrl, {
      method: "PATCH",
      headers: forwardHeaders,
      body: req.body,
      // @ts-expect-error — duplex required for streaming request bodies in Node fetch
      duplex: "half",
    });

    const responseHeaders = new Headers();
    for (const h of ["Upload-Offset", "Tus-Resumable", "Upload-Expires"]) {
      const v = pinataRes.headers.get(h);
      if (v) responseHeaders.set(h, v);
    }

    return new Response(null, { status: pinataRes.status, headers: responseHeaders });
  } catch (err) {
    console.error("[tus proxy PATCH] error:", err);
    return new Response("Proxy error", { status: 502 });
  }
}

export async function HEAD(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pinataUrl = `${PINATA_TUS_BASE}/${path.join("/")}`;

  const pinataRes = await fetch(pinataUrl, {
    method: "HEAD",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Tus-Resumable": req.headers.get("Tus-Resumable") ?? "1.0.0",
    },
  });

  const responseHeaders = new Headers();
  for (const h of ["Upload-Offset", "Upload-Length", "Tus-Resumable", "Upload-Expires", "Cache-Control"]) {
    const v = pinataRes.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }

  return new Response(null, { status: pinataRes.status, headers: responseHeaders });
}
