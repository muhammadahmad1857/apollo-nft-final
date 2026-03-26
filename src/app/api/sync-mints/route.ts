// app/api/sync-mints/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, http, zeroAddress, parseAbiItem } from "viem";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const publicClient = createPublicClient({
  transport: http("https://mainnet-rpc.apolloscan.io"),
});

// Adjust batch size based on RPC performance
const BLOCK_BATCH_SIZE = 5000;

export async function GET() {
  try {
    console.log("[SYNC-MINTS] Fetching last synced tokenId...");

    const lastNFT = await db.nFT.findFirst({
      select: { tokenId: true },
      orderBy: { tokenId: "desc" },
    });

    const fromToken = lastNFT ? Number(lastNFT.tokenId) + 1 : 60;
    console.log(`[SYNC-MINTS] Last tokenId: ${lastNFT?.tokenId ?? "none"}, starting from tokenId: ${fromToken}`);

    // Fetch latest block number
    const latestBlock = Number(await publicClient.getBlockNumber());
    console.log(`[SYNC-MINTS] Latest block: ${latestBlock}`);

    let currentBlock = 0;
    let syncedCount = 0;

    // Loop through blocks in batches
    while (currentBlock <= latestBlock) {
      const toBlock = Math.min(currentBlock + BLOCK_BATCH_SIZE - 1, latestBlock);
      console.log(`[SYNC-MINTS] Fetching logs from blocks ${currentBlock} → ${toBlock}...`);

      let logs = [];
      try {
        logs = await publicClient.getLogs({
          address: nftAddress,
          event: parseAbiItem(
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
          ),
          fromBlock: BigInt(currentBlock),
          toBlock:BigInt(toBlock),
          args: { from: zeroAddress },
        });
      } catch (err) {
        console.warn(`[SYNC-MINTS] Failed fetching logs for blocks ${currentBlock}-${toBlock}, skipping batch`, err);
        currentBlock = toBlock + 1;
        continue;
      }

      // Only process new mints after last tokenId
      const newMints = logs
        .filter((log) => Number(log.args.tokenId) >= fromToken)
        .sort((a, b) => Number(a.args.tokenId) - Number(b.args.tokenId));

      for (const log of newMints) {
        const tokenId = Number(log.args.tokenId);
        const ownerAddress = log.args.to;

        try {
          // Fetch tokenURI
          const uri = (await publicClient.readContract({
            address: nftAddress,
            abi: nftABIArray,
            functionName: "tokenURI",
            args: [BigInt(tokenId)],
          })) as string;

          const httpUri = uri.replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);
          const res = await fetch(httpUri);
          if (!res.ok) continue;
          const meta = await res.json();

          // Fetch royalty
          let royaltyBps = 0;
          try {
            royaltyBps = Number(await publicClient.readContract({
              address: nftAddress,
              abi: nftABIArray,
              functionName: "royaltyBps",
              args: [BigInt(tokenId)],
            }));
          } catch { /* ignore missing royalties */ }

          // Map owner to user
          const creator = await db.user.findUnique({ where: { walletAddress: ownerAddress } });
          if (!creator) continue;

          // Upsert NFT (without blockNumber)
          await db.nFT.upsert({
            where: { tokenId },
            update: { updatedAt: new Date() },
            create: {
              name: meta.name,
              title: meta.title,
              description: meta.description,
              tokenId,
              tokenUri: uri,
              royaltyBps,
              isListed: false,
              creatorId: creator.id,
              ownerId: creator.id,
              mintPrice: 0,
              imageUrl: meta.cover || "",
              mediaUrl: meta.media || "",
              fileType: meta.fileType || "",
              trailer: meta.trailer || null,
              trailerFileType: meta.trailerFileType || null,
            },
          });

          syncedCount++;
        } catch (e) {
          console.error(`[SYNC-MINTS] Failed token #${log.args.tokenId}:`, e);
        }
      }

      currentBlock = toBlock + 1;
    }

    console.log(`[SYNC-MINTS] Sync complete. Total NFTs synced: ${syncedCount}`);
    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (error) {
    console.error("[SYNC-MINTS] Sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}