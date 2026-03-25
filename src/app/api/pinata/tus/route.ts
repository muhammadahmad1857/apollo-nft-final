/**
 * TUS upload proxy — POST (create session)
 *
 * Client sends TUS POST here → we add PINATA_JWT → forward to Pinata.
 * We rewrite the Location header so subsequent PATCH/HEAD requests
 * also go through this proxy (never exposing the JWT to the client).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const PINATA_TUS = "https://uploads.pinata.cloud/v3/files";

const POST_HEADERS_TO_COPY = [
  "Content-Type",
  "Content-Length",
  "Upload-Length",
  "Upload-Defer-Length",
  "Upload-Metadata",
  "Tus-Resumable",
  "Upload-Concat",
];

const POST_RESPONSE_HEADERS = ["Tus-Resumable", "Upload-Expires", "Upload-Offset"];

export async function POST(req: Request) {
  try {
    const forwardHeaders: Record<string, string> = {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    };

    for (const h of POST_HEADERS_TO_COPY) {
      const v = req.headers.get(h);
      if (v) forwardHeaders[h] = v;
    }

    const pinataRes = await fetch(PINATA_TUS, { method: "POST", headers: forwardHeaders });

    const responseHeaders = new Headers();
    for (const h of POST_RESPONSE_HEADERS) {
      const v = pinataRes.headers.get(h);
      if (v) responseHeaders.set(h, v);
    }

    // Rewrite the Pinata Location to our proxy path
    const location = pinataRes.headers.get("Location");
    if (location) {
      const m = location.match(/uploads\.pinata\.cloud\/v3\/files\/(.+)/);
      responseHeaders.set("Location", m ? `/api/pinata/tus/${m[1]}` : location);
    }

    return new Response(null, { status: pinataRes.status, headers: responseHeaders });
  } catch (err) {
    console.error("[tus proxy POST] error:", err);
    return new Response("Proxy error", { status: 502 });
  }
}
