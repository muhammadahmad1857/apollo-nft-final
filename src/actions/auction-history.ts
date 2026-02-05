"use server";

import { db as prisma } from "@/lib/prisma";
import { AuctionHistory } from "@/types/";

export async function getAuctionHistory(walletAddress: string): Promise<AuctionHistory[]> {
  if (!walletAddress) return [];

  // 1️⃣ Find user
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: { id: true },
  });

  if (!user) return [];
  const userId = user.id;

  // 2️⃣ Fetch auctions where user has bids
  const auctions = await prisma.auction.findMany({
    where: {
      bids: {
        some: { bidderId: userId },
      },
    },
    include: {
      nft: true,
      bids: {
        orderBy: { createdAt: "asc" }, // important for last bid
      },
    },
    orderBy: {
      endTime: "desc",
    },
  });

  const now = new Date();

  // 3️⃣ Map Prisma → AuctionHistory
  const history: AuctionHistory[] = auctions.map((auction) => {
    const isEnded = auction.endTime < now;
    const canSettle = isEnded && !auction.settled;

    const userBids = auction.bids.filter((b) => b.bidderId === userId);
    const userLastBid = userBids.length ? userBids[userBids.length - 1].amount : null;

    const status: AuctionHistory["status"] = auction.settled
      ? "settled"
      : isEnded
      ? "ended"
      : "active";

    const timeLeft = isEnded ? 0 : auction.endTime.getTime() - now.getTime();

    return {
      auction: {
        ...auction,
        nft: auction.nft,
        bids: auction.bids,
      },
      userLastBid,
      status,
      isEnded,
      canSettle,
      timeLeft,
    };
  });

  return history;
}
