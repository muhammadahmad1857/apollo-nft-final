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
        keyname: `Signed Upload JWT - ${Date.now()}`, // unique name
        permissions: {
          admin: true, // for scoped key
          endpoints: {
            pinning: {
              pinFileToIPFS: true,
              pinJSONToIPFS: true,
            },
            data: {
              pinList: true,
            },
          },
        },
        maxUses: 1,
      }),
    };
    console.log("Request options:", options);

    // Try the newer documented endpoint first
    const url = "https://api.pinata.cloud/v3/api_keys"; // ← updated
    // Fallback: const url = "https://api.pinata.cloud/users/generateApiKey";
    console.log("Request URL:", url);
    const jwtResponse = await fetch(url, options);

    console.log("Response status:", jwtResponse.status);
    console.log("Response headers:", Object.fromEntries(jwtResponse.headers));

    if (!jwtResponse.ok) {
      const errorText = await jwtResponse.text();
      console.log("Pinata error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate JWT", details: errorText },
        { status: jwtResponse.status }
      );
    }

    const json = await jwtResponse.json();
    console.log("Response JSON:", json);
    return NextResponse.json({ JWT: json.JWT || json.token }); // adjust based on response shape
  } catch (e) {
    console.error("Server error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}