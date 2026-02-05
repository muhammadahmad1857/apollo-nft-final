"use server";
import { db } from "@/lib/prisma";
import { getAddress } from "viem";
import { auctionAddress, auctionABIArray } from "@/lib/wagmi/contracts";
import { readContract } from "@wagmi/core";

export async function getUserAuctionHistory(userAddress: string) {
  if (!userAddress) return { auctions: [], pendingAmount: 0 };
  const address = getAddress(userAddress);
  // Find user by wallet address
  const user = await db.user.findUnique({
    where: { walletAddress: address },
    select: { id: true },
  });
  if (!user) return { auctions: [], pendingAmount: 0 };

  // All bids by user
  const bids = await db.bid.findMany({
    where: { bidderId: user.id },
    include: {
      auction: {
        include: {
          nft: true,
          seller: true,
          highestBidder: true,
        },
      },
    },
  });

  // Group by auction
  const auctionMap = new Map<number, { auction: typeof bids[0]["auction"]; userBids: typeof bids }>();
  for (const bid of bids) {
    if (!bid.auction) continue;
    if (!auctionMap.has(bid.auction.id)) {
      auctionMap.set(bid.auction.id, { auction: bid.auction, userBids: [] });
    }
    auctionMap.get(bid.auction.id)!.userBids.push(bid);
  }

  // Compose auction history
  const auctions = Array.from(auctionMap.values()).map(({ auction, userBids }) => {
    const userHighestBid = Math.max(...userBids.map(b => b.amount));
    const won = auction.highestBidderId === user.id && auction.settled;
    const canSettle = auction.highestBidderId === user.id && !auction.settled && new Date(auction.endTime) < new Date();
    return {
      auction,
      userHighestBid,
      won,
      canSettle,
      nft: auction.nft,
      seller: auction.seller,
      highestBid: auction.highestBid,
      highestBidder: auction.highestBidder,
    };
  });
    
  return { auctions };
}
