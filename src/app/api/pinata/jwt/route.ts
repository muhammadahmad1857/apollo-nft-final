import { NextResponse } from "next/server";

export async function POST() {
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
    const jwtResponse = await fetch(url, options);

    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text();
      return NextResponse.json(
        { error: "Failed to generate JWT", details: errorText },
        { status: jwtResponse.status }
      );
    }

    const json = await jwtResponse.json();
    return NextResponse.json({ JWT: json.JWT || json.token });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}