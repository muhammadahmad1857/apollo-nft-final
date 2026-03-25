import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * POST /api/pending-mints/:id/finalize
 *
 * Called by the client poller once the Pinata CID is available.
 * 1. Builds the metadata JSON from the PendingMint record + the now-known mediaUrl
 * 2. Uploads it to Pinata server-side (never exposes PINATA_JWT to the client)
 * 3. Updates PendingMint to status=pending_sign with both mediaUrl and metadataUrl
 * 4. Creates an in-app Notification so the user knows to sign
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { mediaUrl } = (await req.json()) as { mediaUrl: string };

    if (!mediaUrl) {
      return NextResponse.json({ error: "mediaUrl required" }, { status: 400 });
    }

    const pending = await db.pendingMint.findUnique({ where: { id } });
    if (!pending) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (pending.status !== "pending_upload") {
      // Already finalized or past this stage
      return NextResponse.json({ metadataUrl: pending.metadataUrl });
    }

    // Build metadata JSON (same shape as the normal mint flow)
    const metadata = {
      name: pending.name,
      title: pending.title,
      description: pending.description,
      cover: pending.coverImageUrl,
      media: mediaUrl,
      fileType: pending.fileType,
      trailer: pending.trailerUrl ?? undefined,
      trailerFileType: pending.trailerFileType ?? undefined,
    };

    // Upload metadata JSON to Pinata server-side
    const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
    const file = new File([blob], `${pending.name || "nft"}-metadata.json`, {
      type: "application/json",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("network", "public");

    const uploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("[finalize] Pinata upload error:", errText);
      return NextResponse.json({ error: "Metadata upload failed" }, { status: 502 });
    }

    const uploadJson = await uploadRes.json();
    const metadataUrl = `ipfs://${uploadJson.IpfsHash}`;

    // Update PendingMint
    await db.pendingMint.update({
      where: { id },
      data: { mediaUrl, metadataUrl, status: "pending_sign" },
    });

    // Create in-app notification
    await db.notification.create({
      data: {
        recipientWalletAddress: pending.walletAddress,
        type: "PENDING_MINT_READY",
        title: "Your NFT is ready to mint!",
        message: `"${pending.title}" finished uploading. Tap to sign and mint it on-chain.`,
        metadata: { pendingMintId: id },
      },
    });

    return NextResponse.json({ metadataUrl });
  } catch (err) {
    console.error("[pending-mints finalize]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
