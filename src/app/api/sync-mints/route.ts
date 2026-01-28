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
    const last = await db.nFT.findFirst({
      select: { tokenId: true },
      orderBy: { tokenId: "desc" },
    });
    const fromToken = last ? Number(last.tokenId) + 1 : 1;

    // 2️⃣ Fetch all Transfer events where from == zeroAddress (mint)
    const logs = await publicClient.getLogs({
      address: nftAddress,
      event: parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      ),
      fromBlock: "earliest",
      args: { from: zeroAddress },
    });

    // 3️⃣ Filter only new mints
    const newMints = logs
      .filter((log) => Number(log.args.tokenId) >= fromToken)
      .sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

    let syncedCount = 0;

    for (const log of newMints) {
      const tokenId = Number(log.args.tokenId);
      const ownerAddress = log.args.to; // new minter / owner
      try {
        // 4️⃣ Get tokenURI
        const uri = (await publicClient.readContract({
          address: nftAddress,
          abi: nftABIArray,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        })) as string;

        const httpUri = uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        const res = await fetch(httpUri);
        if (!res.ok) continue;
        const meta = await res.json();

        // 5️⃣ Get royalty
        let royaltyBps = 0;
        try {
          const royalty = await publicClient.readContract({
            address: nftAddress,
            abi: nftABIArray,
            functionName: "royaltyBps",
            args: [BigInt(tokenId)],
          });
          royaltyBps = Number(royalty);
        } catch {
          console.warn(`No royalty info for token #${tokenId}`);
        }

        // 6️⃣ Map blockchain addresses to your users in DB
        const creator = await db.user.findUnique({ where: { walletAddress: ownerAddress } });
        if (!creator) {
          console.warn(`No user found for address ${ownerAddress}, skipping token ${tokenId}`);
          continue;
        }

        // 7️⃣ Upsert NFT
        await db.nFT.upsert({
          where: { tokenId },
          update: { updatedAt: new Date() },
          create: {
            tokenId,
            tokenUri: uri,
            mintPrice: 0.1,
            royaltyBps,
            isListed: false,
            creatorId: creator.id,
            ownerId: creator.id,
          },
        });

        syncedCount++;
      } catch (e) {
        console.error(`Failed token #${tokenId}:`, e);
      }
    }

    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
