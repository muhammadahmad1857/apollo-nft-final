import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side TUS proxy to Pinata's TUS endpoint.
 * Handles large file uploads by proxying requests and ensuring proper headers.
 * 
 * This fixes HTTP/2 protocol errors that occur with direct browser-to-Pinata uploads
 * for files > ~50MB by handling the request server-side with proper error recovery.
 */
export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json(
      { error: "Missing fileId parameter" },
      { status: 400 }
    );
  }

  console.log(`[TUS Proxy HEAD] Checking upload status for file: ${fileId}`);

  try {
    // Forward HEAD request to Pinata's TUS endpoint
    const pinataUrl = `https://uploads.pinata.cloud/v3/files/${fileId}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Tus-Resumable": "1.0.0",
    };

    console.log(`[TUS Proxy HEAD] Forwarding to: ${pinataUrl}`);
    const response = await fetch(pinataUrl, {
      method: "HEAD",
      headers,
    });

    console.log(`[TUS Proxy HEAD] Pinata response: ${response.status}`);

    // Copy all relevant headers from Pinata response
    const proxiedHeaders = new Headers();
    const headersToProxy = [
      "upload-offset",
      "upload-length",
      "tus-resumable",
      "tus-version",
      "tus-extension",
      "cache-control",
    ];

    headersToProxy.forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        proxiedHeaders.set(header, value);
        console.log(`[TUS Proxy HEAD]   ${header}: ${value}`);
      }
    });

    // Ensure required TUS headers exist
    if (!proxiedHeaders.get("upload-offset")) {
      console.warn(`[TUS Proxy HEAD] Missing Upload-Offset, setting to 0`);
      proxiedHeaders.set("upload-offset", "0");
    }

    return new NextResponse(null, {
      status: response.status,
      headers: proxiedHeaders,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[TUS Proxy HEAD] FAILED: ${errMsg}`);
    return NextResponse.json(
      { error: "TUS HEAD request failed", details: errMsg },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json(
      { error: "Missing fileId parameter" },
      { status: 400 }
    );
  }

  console.log(`[TUS Proxy PATCH] Handling chunk upload for file: ${fileId}`);

  try {
    // Get chunk data and headers from request
    const uploadOffset = request.headers.get("upload-offset");
    const uploadLength = request.headers.get("upload-length");
    const contentLength = request.headers.get("content-length");

    console.log(
      `[TUS Proxy PATCH] Offset: ${uploadOffset}, Length: ${uploadLength}, Chunk size: ${contentLength}`
    );

    // Read request body as buffer
    const chunk = await request.arrayBuffer();
    console.log(`[TUS Proxy PATCH] Read ${chunk.byteLength} bytes from request`);

    // Forward PATCH request to Pinata
    const pinataUrl = `https://uploads.pinata.cloud/v3/files/${fileId}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Tus-Resumable": "1.0.0",
      "Content-Type": "application/offset+octet-stream",
    };

    if (uploadOffset) headers["Upload-Offset"] = uploadOffset;
    if (uploadLength) headers["Upload-Length"] = uploadLength;

    console.log(`[TUS Proxy PATCH] Forwarding to: ${pinataUrl}`);
    const response = await fetch(pinataUrl, {
      method: "PATCH",
      headers,
      body: chunk,
    });

    console.log(`[TUS Proxy PATCH] Pinata response: ${response.status}`);

    // Copy response headers
    const proxiedHeaders = new Headers();
    const headersToProxy = [
      "upload-offset",
      "upload-length",
      "tus-resumable",
      "tus-version",
      "tus-extension",
      "location",
      "cache-control",
    ];

    headersToProxy.forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        proxiedHeaders.set(header, value);
        console.log(`[TUS Proxy PATCH]   ${header}: ${value}`);
      }
    });

    // Read response body if any
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: proxiedHeaders,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[TUS Proxy PATCH] FAILED: ${errMsg}`);
    return NextResponse.json(
      { error: "TUS PATCH request failed", details: errMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log(`[TUS Proxy POST] Initiating new upload session`);

  try {
    const body = await request.json();
    const { filename, filesize } = body;

    console.log(`[TUS Proxy POST] File: ${filename}, Size: ${filesize}`);

    // Forward POST (init) request to Pinata
    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(filesize || 0),
      "Upload-Metadata": `filename ${Buffer.from(filename || "").toString(
        "base64"
      )}`,
    };

    console.log(`[TUS Proxy POST] Forwarding to Pinata TUS endpoint`);
    const response = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers,
    });

    console.log(`[TUS Proxy POST] Pinata response: ${response.status}`);

    // Get location header with file ID
    const location = response.headers.get("location");
    console.log(`[TUS Proxy POST] Upload location: ${location}`);

    if (response.status === 201 && location) {
      // Extract file ID from location
      const fileId = location.split("/").pop();
      console.log(`[TUS Proxy POST] SUCCESS! File ID: ${fileId}`);

      return NextResponse.json(
        { location, fileId },
        { status: 201, headers: { Location: location } }
      );
    }

    const responseText = await response.text();
    console.error(
      `[TUS Proxy POST] Unexpected response: ${response.status} - ${responseText}`
    );
    return NextResponse.json(
      { error: "Failed to initiate upload", details: responseText },
      { status: response.status }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[TUS Proxy POST] FAILED: ${errMsg}`);
    return NextResponse.json(
      { error: "TUS POST request failed", details: errMsg },
      { status: 500 }
    );
  }
}
