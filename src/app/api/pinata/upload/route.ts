// pages/api/pin-cid.ts (Next.js API route example)
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { cid } = req.body;

    if (!cid) return res.status(400).json({ error: "CID is required" });

    const pinRes = await fetch("https://api.pinata.cloud/pinning/pinByHash", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hashToPin: cid,
        options: { cidVersion: 1 },
      }),
    });

    const data = await pinRes.json();

    if (!pinRes.ok) return res.status(pinRes.status).json(data);

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Pin CID error:", err);
    res.status(500).json({ error: "Failed to pin CID" });
  }
}
