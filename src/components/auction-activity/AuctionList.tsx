"use client";

import React, { useState } from "react";
import { AuctionHistory } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDistanceStrict, format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useSettleAuction } from "@/hooks/useAuction";
import { toast } from "sonner";

interface AuctionListProps {
  auctions: AuctionHistory[];
  loading?: boolean;
  userId?: number;
}

export default function AuctionList({ auctions, loading, userId }: AuctionListProps) {
  const { settleAuction } = useSettleAuction();

  const [settledMap, setSettledMap] = useState<Record<number, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading auctions...</div>;
  }

  if (!auctions.length) {
    return <div className="text-center py-8 text-muted-foreground">No auctions found.</div>;
  }

  const handleSettleOrCancel = async (a: AuctionHistory, isCancel = false) => {
    if (!a?.auction?.id || !a.auction.nft?.tokenId) return;

    const auctionId = a.auction.id;

    setLoadingMap((prev) => ({ ...prev, [auctionId]: true }));

    try {
      await settleAuction(
        BigInt(a.auction.nft.tokenId),
        a.auction.id,
        a.auction.highestBidderId
      );

      // ⚡ realtime UI update
      setSettledMap((prev) => ({ ...prev, [auctionId]: true }));

      toast.success(isCancel ? "Auction cancelled 🛑" : "Auction settled 🏁");
    } catch (err: any) {
      toast.error(err?.message || "Transaction failed");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [auctionId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {auctions.map((a) => {
        const now = new Date();
        const isActive = a.status === "active";
        const isEnded = a.status === "ended";

        // ✅ realtime settled state
        const isSettled = settledMap[a.auction.id] ?? a.auction.settled;
        const settleLoading = loadingMap[a.auction.id];

        const isWon = a.auction.highestBidderId === userId && isEnded;
        const isLost = a.auction.highestBidderId !== userId && isEnded;

        let statusBadge = "";
        if (isActive) statusBadge = "🟢 Active";
        else if (isWon && !isSettled) statusBadge = "🏆 Won";
        else if (isLost) statusBadge = "❌ Lost";
        else if (isEnded && !isSettled) statusBadge = "⏳ Awaiting Settlement";
        else if (isSettled) statusBadge = "✅ Settled";

        const timerText = isActive
          ? `Ends in: ${formatDistanceStrict(now, a.auction.endTime)}`
          : `Ended on: ${format(new Date(a.auction.endTime), "yyyy-MM-dd")}`;

        const userLastBid = a.userLastBid ?? 0;

        return (
          <div
            key={a.auction.id}
            className="glass-card border-white/20 flex flex-col md:flex-row rounded-lg shadow p-4 gap-4 w-full"
          >
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

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="mb-2">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  {a.auction.nft.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Token ID: {a.auction.nft.tokenId}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Min Bid:</span>{" "}
                  <span className="font-medium">{a.auction.minBid} APOLLO</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Highest Bid:</span>{" "}
                  <span className="font-medium">{a.auction.highestBid ?? 0} APOLLO</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Your Last Bid:</span>{" "}
                  <span className="font-medium">{userLastBid} APOLLO</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-zinc-800">
                  {statusBadge}
                </span>
                <span className="text-sm text-muted-foreground">{timerText}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-center gap-2 min-w-35">
              {/* View NFT */}
              <Link href={`/nft/${a.auction.nft.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                  View NFT
                </Button>
              </Link>

              {/* Rebid */}
              {isActive && (
                <Button className="bg-green-600 hover:bg-green-700 w-full">
                  Rebid
                </Button>
              )}

              {/* Cancel / Settle */}
              {!isSettled && (
                <Button
                  onClick={() => handleSettleOrCancel(a, !isEnded)}
                  disabled={settleLoading}
                  className="bg-orange-600 hover:bg-orange-700 w-full"
                >
                  {settleLoading
                    ? "Processing..."
                    : isEnded
                    ? "Settle Auction 🏁"
                    : "Cancel Auction 🛑"}
                </Button>
              )}

              {/* Settled */}
              {isSettled && (
                <div className="text-green-600 font-semibold text-center">
                  ✅ Settled
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
