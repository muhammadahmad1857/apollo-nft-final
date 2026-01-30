// app/api/sync-mints/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, http, zeroAddress, parseAbiItem } from "viem";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const publicClient = createPublicClient({
  transport: http("https://mainnet-rpc.apolloscan.io"),
});

export async function GET() {
  try {
    // 1️⃣ Get last synced tokenId
    console.log("[SYNC-MINTS] Step 1: Fetching last synced tokenId from DB...");
    const last = await db.nFT.findFirst({
      select: { tokenId: true },
      orderBy: { tokenId: "desc" },
    });
    const fromToken = last ? Number(last.tokenId) + 1 : 1;
    console.log(`[SYNC-MINTS] Last tokenId: ${last ? last.tokenId : "none"}, fromToken: ${fromToken}`);

    // 2️⃣ Fetch all Transfer events where from == zeroAddress (mint)
    console.log("[SYNC-MINTS] Step 2: Fetching mint Transfer events from chain...");
    const logs = await publicClient.getLogs({
      address: nftAddress,
      event: parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      ),
      fromBlock: "earliest",
      args: { from: zeroAddress },
    });
    console.log(`[SYNC-MINTS] Total mint logs fetched: ${logs.length}`);

    // 3️⃣ Filter only new mints
    console.log("[SYNC-MINTS] Step 3: Filtering new mints...");
    const newMints = logs
      .filter((log) => Number(log.args.tokenId) >= fromToken)
      .sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
    console.log(`[SYNC-MINTS] New mints to sync: ${newMints.length}`);

    let syncedCount = 0;

    for (const log of newMints) {
      const tokenId = Number(log.args.tokenId);
      const ownerAddress = log.args.to; // new minter / owner
      console.log(`[SYNC-MINTS] Processing tokenId: ${tokenId}, owner: ${ownerAddress}`);
      try {
        // 4️⃣ Get tokenURI
        console.log(`[SYNC-MINTS] Step 4: Fetching tokenURI for tokenId ${tokenId}...`);
        const uri = (await publicClient.readContract({
          address: nftAddress,
          abi: nftABIArray,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        })) as string;

        const httpUri = uri.replace("ipfs://", "https://process.env.NEXT_PUBLIC_GATEWAY_URL/ipfs/");
        console.log(`[SYNC-MINTS] Fetching metadata from: ${httpUri}`);
        const res = await fetch(httpUri);
        if (!res.ok) {
          console.warn(`[SYNC-MINTS] Metadata fetch failed for tokenId ${tokenId}, skipping.`);
        }
        const meta = await res.json();
        console.log(`[SYNC-MINTS] Metadata for tokenId ${tokenId}:`, meta);

        // 5️⃣ Get royalty
        let royaltyBps = 0;
        try {
          console.log(`[SYNC-MINTS] Step 5: Fetching royaltyBps for tokenId ${tokenId}...`);
          const royalty = await publicClient.readContract({
            address: nftAddress,
            abi: nftABIArray,
            functionName: "royaltyBps",
            args: [BigInt(tokenId)],
          });
          royaltyBps = Number(royalty);
          console.log(`[SYNC-MINTS] RoyaltyBps for tokenId ${tokenId}: ${royaltyBps}`);
        } catch {
          console.warn(`[SYNC-MINTS] No royalty info for token #${tokenId}`);
        }

        // 6️⃣ Map blockchain addresses to your users in DB
        console.log(`[SYNC-MINTS] Step 6: Mapping owner address to user in DB: ${ownerAddress}`);
        const creator = await db.user.findUnique({ where: { walletAddress: ownerAddress } });
        if (!creator) {
          console.warn(`[SYNC-MINTS] No user found for address ${ownerAddress}, skipping token ${tokenId}`);
          continue;
        }

        // 7️⃣ Upsert NFT
        console.log(`[SYNC-MINTS] Step 7: Upserting NFT for tokenId ${tokenId}...`);
        await db.nFT.upsert({
          where: { tokenId },
          update: { updatedAt: new Date() },
          create: {
            name:meta.name,
            title:meta.title,
            description:meta.description,
            tokenId,
            tokenUri: uri,
            mintPrice: 0.1,
            royaltyBps,
            isListed: false,
            creatorId: creator.id,
            ownerId: creator.id,
          },
        });
        console.log(`[SYNC-MINTS] NFT upserted for tokenId ${tokenId}`);

        syncedCount++;
      } catch (e) {
        console.error(`[SYNC-MINTS] Failed token #${tokenId}:`, e);
      }
    }

    console.log(`[SYNC-MINTS] Sync complete. Total NFTs synced: ${syncedCount}`);
    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error("[SYNC-MINTS] Sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
