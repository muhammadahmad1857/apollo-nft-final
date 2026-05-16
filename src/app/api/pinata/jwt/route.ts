import { NextResponse } from "next/server";

export async function POST() {
  console.log(`[Pinata JWT] Request received - generating scoped JWT key`);
  try {
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        keyname: `Signed Upload JWT - ${Date.now()}`,
        permissions: {
          endpoints: {
            pinning: {
              pinFileToIPFS: true,
            },
          },
        },
        maxUses: 100,
      }),
    };

    const url = "https://api.pinata.cloud/v3/api_keys";
    console.log(`[Pinata JWT] Calling Pinata API: ${url}`);
    const jwtResponse = await fetch(url, options);

    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text();
      console.error(
        `[Pinata JWT] FAILED: HTTP ${jwtResponse.status} - ${errorText.slice(0, 200)}`
      );
      return NextResponse.json(
        { error: "Failed to generate JWT", details: errorText },
        { status: jwtResponse.status }
      );
    }

    const json = await jwtResponse.json();
    console.log(`[Pinata JWT] SUCCESS! JWT key generated`);
    return NextResponse.json({ JWT: json.JWT || json.token });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Pinata JWT] FAILED with exception: ${errMsg}`);
    return NextResponse.json({ error: "Server error", details: errMsg }, { status: 500 });
  }
}