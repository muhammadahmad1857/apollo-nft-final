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

    // Build response headers to send back to client and add CORS + Location rewriting
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (HOP_BY_HOP.includes(k)) return;
      responseHeaders[key] = value;
    });

    // Ensure CORS headers so browser can access proxied responses
    const origin = req.headers.get("origin") || "*";
    responseHeaders["Access-Control-Allow-Origin"] = origin;
    responseHeaders["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
    responseHeaders["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Tus-Resumable, Upload-Offset, Upload-Length, Upload-Metadata";
    responseHeaders["Access-Control-Expose-Headers"] = "Location, Upload-Offset, Upload-Length, Tus-Resumable";

    // Rewrite Location header returned by Pinata to point back to our proxy
    const locationHeader = res.headers.get("location");
    if (locationHeader) {
      try {
        const base = req.nextUrl.origin; // e.g. http://localhost:3000 or https://yourdomain
        // Replace pinata host with our proxy prefix
        const rewritten = locationHeader.replace(
          /https?:\/\/uploads\.pinata\.cloud\//i,
          `${base}/api/pinata/proxy/`
        );
        responseHeaders["Location"] = rewritten;
        console.log(`[Pinata Proxy] Location header rewritten: ${locationHeader} -> ${rewritten}`);
      } catch {
        // ignore rewrite errors
      }
    }

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
  const origin = req.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Tus-Resumable, Upload-Offset, Upload-Length, Upload-Metadata",
      "Access-Control-Expose-Headers": "Location, Upload-Offset, Upload-Length, Tus-Resumable",
      "Access-Control-Max-Age": "86400",
    },
  });
}
