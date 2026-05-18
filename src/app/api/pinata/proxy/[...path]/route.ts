import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

async function forwardRequest(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    // Strip prefix `/api/pinata/proxy/` to build the target Pinata path
    const targetPath = pathname.replace(/^\/api\/pinata\/proxy\/?/, "");
    const targetUrl = `https://uploads.pinata.cloud/${targetPath}${req.nextUrl.search}`;

    // Read request body if present
    let body: ArrayBuffer | undefined = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await req.arrayBuffer();
      } catch {
        // ignore if no body
      }
    }

    // Copy headers from incoming request but avoid hop-by-hop and host
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === "host") return;
      if (HOP_BY_HOP.includes(k)) return;
      headers[key] = value;
    });

    // Add server-side Authorization so browser doesn't need to send it
    const pinataJwt = process.env.PINATA_JWT || "";
    if (pinataJwt) headers["Authorization"] = `Bearer ${pinataJwt}`;

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
      // make sure we don't follow redirects automatically
      redirect: "manual",
    });

    // Build response headers to send back to client
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (HOP_BY_HOP.includes(k)) return;
      responseHeaders[key] = value;
    });

    const arrayBuffer = await res.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Pinata Proxy] ERROR: ${msg}`);
    return NextResponse.json({ error: "Proxy error", details: msg }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  return forwardRequest(req);
}

export async function POST(req: NextRequest) {
  return forwardRequest(req);
}

export async function PATCH(req: NextRequest) {
  return forwardRequest(req);
}

export async function PUT(req: NextRequest) {
  return forwardRequest(req);
}

export async function DELETE(req: NextRequest) {
  return forwardRequest(req);
}

export async function OPTIONS(req: NextRequest) {
  // Respond with 200 OK for any preflight made to our proxy
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    },
  });
}
