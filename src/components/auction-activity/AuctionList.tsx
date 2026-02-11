// components/auction-history/AuctionList.tsx
"use client";

import React from "react";
import { AuctionHistory } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDistanceStrict, format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

interface AuctionListProps {
  auctions: AuctionHistory[];
  loading?: boolean;
  userId?: number; // Needed to highlight wins/losses
}

export default function AuctionList({ auctions, loading, userId }: AuctionListProps) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading auctions...</div>;
  }

  if (!auctions.length) {
    return <div className="text-center py-8 text-muted-foreground">No auctions found.</div>;
  }

  return (
    <div className="space-y-6">
      {auctions.map((a) => {
        const now = new Date();
        const isActive = a.status === "active";
        const isEnded = a.status === "ended";
        const isSettled = a.auction.settled;
        const isWon = a.auction.highestBidderId === userId && isEnded;
        const isLost = a.auction.highestBidderId !== userId && isEnded;

        // Status badge
        let statusBadge = "";
        if (isActive) statusBadge = "🟢 Active";
        else if (isWon && !isSettled) statusBadge = "🏆 Won";
        else if (isLost) statusBadge = "❌ Lost";
        else if (isEnded && !isWon && !isLost && !isSettled) statusBadge = "⏳ Awaiting Settlement";
        else if (isSettled) statusBadge = "✅ Settled";

        // Timer
        const timerText = isActive
          ? `Ends in: ${formatDistanceStrict(now, a.auction.endTime)}`
          : `Ended on: ${format(new Date(a.auction.endTime), "yyyy-MM-dd")}`;

        // User last bid
        const userLastBid = a.userLastBid ?? 0;

        return (
          <div key={a.auction.id} className="flex flex-col md:flex-row bg-white dark:bg-zinc-900 rounded-lg shadow p-4 gap-4 w-full">
            {/* NFT Image */}
            <div className="w-full md:w-32 h-32 shrink-0">
              <Image
                src={a.auction.nft.imageUrl}
                alt={a.auction.nft.name}
                className="w-full h-full object-cover rounded-lg"
                width={128}
                height={128}
              />
            </div>

            {/* NFT & Auction Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="mb-2">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{a.auction.nft.name}</h3>
                <p className="text-sm text-muted-foreground">Token ID: {a.auction.nft.tokenId}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Min Bid:</span>{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{a.auction.minBid} APOLLO</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Highest Bid:</span>{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{a.auction.highestBid ?? 0} APOLLO</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Your Last Bid:</span>{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{userLastBid} APOLLO</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-zinc-800 dark:text-zinc-100">
                  {statusBadge}
                </span>
                <span className="text-sm text-muted-foreground">{timerText}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center gap-2">
              {isActive && (
                <>
                  <Button className="bg-blue-600 hover:bg-blue-700">View NFT</Button>
                  <Button className="bg-green-600 hover:bg-green-700">Rebid</Button>
                </>
              )}

              {!isSettled && (
                <Button className="bg-orange-600 hover:bg-orange-700">{isEnded ? "Settle" : "Cancel"} Auction 🏁</Button>
              )}
<Link href={`/nft/${a.auction.nft.id}`} passHref>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">View NFT</Button>
</Link>
              {isSettled && <div className="text-green-600 font-semibold">✅ Settled</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
