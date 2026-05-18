import { NextResponse } from "next/server";

export async function POST() {
  console.log(`[Signed Upload URL] Request received`);
  try {
    // Call the JWT endpoint internally to get a scoped key
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log(`[Signed Upload URL] Fetching JWT from: ${baseUrl}/api/pinata/jwt`);
    const jwtResponse = await fetch(`${baseUrl}/api/pinata/jwt`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text();
      console.error(
        `[Signed Upload URL] FAILED to get JWT: HTTP ${jwtResponse.status} - ${errorText}`
      );
      return NextResponse.json(
        { error: "Failed to generate scoped key", details: errorText },
        { status: jwtResponse.status }
      );
    }

    const jwtData = await jwtResponse.json();
    console.log(`[Signed Upload URL] JWT response received`);

    if (!jwtData.JWT) {
      console.error(`[Signed Upload URL] FAILED: No JWT in response`);
      return NextResponse.json(
        { error: "Failed to generate scoped key", details: "No JWT in response" },
        { status: 500 }
      );
    }

    // Return a proxied TUS endpoint on our domain to avoid client-side CORS
    console.log(`[Signed Upload URL] SUCCESS! Returning proxied TUS endpoint`);
    return NextResponse.json({
      data: {
        // Client will POST/patch to this proxy; the proxy will forward to Pinata
        url: `${baseUrl}/api/pinata/proxy/v3/files`,
        // Token is intentionally not returned — proxy will add Authorization server-side
        token: "",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Signed Upload URL] FAILED with exception: ${errorMessage}`);
    return NextResponse.json(
      { error: "Server error", details: errorMessage },
      { status: 500 }
    );
  }
}
