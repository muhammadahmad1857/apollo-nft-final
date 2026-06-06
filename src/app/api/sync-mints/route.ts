// app/api/sync-mints/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, http, zeroAddress, parseAbiItem } from "viem";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { db } from "@/lib/prisma";
import { resolveIPFS } from "@/lib/ipfs";

export const dynamic = "force-dynamic";

const publicClient = createPublicClient({
  transport: http("https://mainnet-rpc.apolloscan.io"),
});

const BLOCK_BATCH_SIZE = 5000;

async function findUserByWallet(walletAddress: string) {
  return db.user.findFirst({
    where: {
      walletAddress: { equals: walletAddress, mode: "insensitive" },
    },
  });
}

export async function GET() {
  try {
    console.log("[SYNC-MINTS] Fetching last synced tokenId...");

    const [lastNFT, syncState, nftCount] = await Promise.all([
      db.nFT.findFirst({
        select: { tokenId: true },
        orderBy: { tokenId: "desc" },
      }),
      db.syncState.findUnique({ where: { id: 1 } }),
      db.nFT.count(),
    ]);

    const fromToken = lastNFT ? Number(lastNFT.tokenId) + 1 : 60;
    console.log(`[SYNC-MINTS] Last tokenId: ${lastNFT?.tokenId ?? "none"}, starting from tokenId: ${fromToken}`);

    const latestBlock = Number(await publicClient.getBlockNumber());
    console.log(`[SYNC-MINTS] Latest block: ${latestBlock}`);
    const logsTest = await publicClient.getLogs({
      address: nftAddress,
      fromBlock: BigInt(9149343),
      toBlock: BigInt(9149343),
    });
    console.dir(logsTest, { depth: null });
    console.log(logsTest);
    if (!syncState && nftCount > 0) {
      await db.syncState.upsert({
        where: { id: 1 },
        create: { id: 1, lastSyncedBlock: latestBlock },
        update: { lastSyncedBlock: latestBlock },
      });
      console.log(`[SYNC-MINTS] Bootstrapped cursor to block ${latestBlock} (existing NFTs indexed)`);
      return NextResponse.json({ success: true, synced: 0, bootstrapped: true });
    }

    let currentBlock: number;
    if (syncState) {
      currentBlock = syncState.lastSyncedBlock + 1;
    } else {
      currentBlock = Number(process.env.NFT_DEPLOYMENT_BLOCK ?? 0);
    }

    if (currentBlock > latestBlock) {
      console.log(`[SYNC-MINTS] Already up to date (block ${latestBlock})`);
      return NextResponse.json({ success: true, synced: 0, upToDate: true });
    }

    console.log(`[SYNC-MINTS] Resuming from block ${currentBlock} → ${latestBlock}`);

    let syncedCount = 0;
    const skipped: { tokenId: number; reason: string }[] = [];

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
          toBlock: BigInt(toBlock),
          args: { from: zeroAddress },
        });
      } catch (err) {
        console.warn(`[SYNC-MINTS] Failed fetching logs for blocks ${currentBlock}-${toBlock}, will retry next run`, err);
        break;
      }

      console.log(`[SYNC-MINTS] Found ${logs.length} mint log(s) in batch`);

      const newMints = logs
        .filter((log) => Number(log.args.tokenId) >= fromToken)
        .sort((a, b) => Number(a.args.tokenId) - Number(b.args.tokenId));

      if (logs.length > 0 && newMints.length === 0) {
        console.log(`[SYNC-MINTS] All mints in batch are below fromToken ${fromToken}, skipping`);
      }

      for (const log of newMints) {
        const tokenId = Number(log.args.tokenId);
        const ownerAddress = log.args.to!;

        try {
          const uri = (await publicClient.readContract({
            address: nftAddress,
            abi: nftABIArray,
            functionName: "tokenURI",
            args: [BigInt(tokenId)],
          })) as string;

          const httpUri = resolveIPFS(uri);
          if (!httpUri) {
            const reason = "metadata URL could not be resolved (check NEXT_PUBLIC_GATEWAY_URL)";
            console.warn(`[SYNC-MINTS] Skipping token #${tokenId}: ${reason}`);
            skipped.push({ tokenId, reason });
            continue;
          }

          const res = await fetch(httpUri);
          if (!res.ok) {
            const reason = `metadata fetch failed (${res.status}) from ${httpUri}`;
            console.warn(`[SYNC-MINTS] Skipping token #${tokenId}: ${reason}`);
            skipped.push({ tokenId, reason });
            continue;
          }
          const meta = await res.json();

          let royaltyBps = 0;
          try {
            royaltyBps = Number(await publicClient.readContract({
              address: nftAddress,
              abi: nftABIArray,
              functionName: "royaltyBps",
              args: [BigInt(tokenId)],
            }));
          } catch { /* ignore missing royalties */ }

          const creator = await findUserByWallet(ownerAddress);
          if (!creator) {
            const reason = `minter wallet not registered as User (${ownerAddress})`;
            console.warn(`[SYNC-MINTS] Skipping token #${tokenId}: ${reason}`);
            skipped.push({ tokenId, reason });
            continue;
          }

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
          console.log(`[SYNC-MINTS] Synced token #${tokenId}`);
        } catch (e) {
          console.error(`[SYNC-MINTS] Failed token #${tokenId}:`, e);
          skipped.push({ tokenId, reason: "unexpected error during sync" });
        }
      }

      await db.syncState.upsert({
        where: { id: 1 },
        create: { id: 1, lastSyncedBlock: toBlock },
        update: { lastSyncedBlock: toBlock },
      });

      currentBlock = toBlock + 1;
    }

    if (skipped.length > 0) {
      console.warn(`[SYNC-MINTS] Skipped ${skipped.length} token(s):`, skipped);
    }

    console.log(`[SYNC-MINTS] Sync complete. Total NFTs synced: ${syncedCount}`);
    return NextResponse.json({ success: true, synced: syncedCount, skipped });
  } catch (error) {
    console.error("[SYNC-MINTS] Sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
