import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import fetch from "node-fetch";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert browser File to Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pinataForm = new FormData();
    pinataForm.append("file", buffer, file.name);
    pinataForm.append(
      "pinataMetadata",
      JSON.stringify({ name: file.name })
    );

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`, // JWT from env
        // DO NOT set Content-Type manually
      },
      body: pinataForm,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Pinata upload failed" }, { status: 500 });
  }
};
