import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Call the JWT endpoint internally to get a scoped key
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const jwtResponse = await fetch(`${baseUrl}/api/pinata/jwt`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text();
      return NextResponse.json(
        { error: "Failed to generate scoped key", details: errorText },
        { status: jwtResponse.status }
      );
    }

    const jwtData = await jwtResponse.json();

    if (!jwtData.JWT) {
      return NextResponse.json(
        { error: "Failed to generate scoped key", details: "No JWT in response" },
        { status: 500 }
      );
    }

    // Return the direct Pinata TUS endpoint URL with the scoped key
    return NextResponse.json({
      data: {
        url: "https://uploads.pinata.cloud/v3/files",
        token: process.env.PINATA_JWT,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Server error", details: errorMessage },
      { status: 500 }
    );
  }
}
