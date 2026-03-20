import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create a short-lived scoped API key for this upload
    const keyRes = await fetch("https://api.pinata.cloud/v3/api_keys", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyname: `tus-upload-${Date.now()}`,
        permissions: { admin: true },
        maxUses: 100, // enough for chunked TUS patches
      }),
    });

    if (!keyRes.ok) {
      const errText = await keyRes.text();
      console.error("[signed-upload-url] Pinata key error:", errText);
      throw new Error(errText || "Failed to create upload key");
    }

    const keyData = await keyRes.json() as Record<string, unknown>;
    console.log("[signed-upload-url] api_keys response:", JSON.stringify(keyData));
    const token = (keyData.JWT ?? keyData.token) as string | undefined;

    if (!token) {
      throw new Error("No JWT returned from Pinata API keys endpoint");
    }

    return NextResponse.json({
      data: {
        url: "https://uploads.pinata.cloud/v3/files",
        token,
      },
    });
  } catch (err) {
    console.error("[signed-upload-url] Exception:", err);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
