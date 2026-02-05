
"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useWithdraw } from "@/hooks/useWithdraw";
import { useSettleAuctionAction } from "@/hooks/useSettleAuctionAction";
import { usePendingReturns } from "@/hooks/usePendingReturns";
import { getUserAuctionHistory } from "@/actions/auction-history";
import { PendingAmountCard } from "@/components/dashboard/PendingAmountCard";
import { AuctionHistoryList } from "@/components/dashboard/AuctionHistoryList";
import { AuctionStatsChart } from "@/components/dashboard/AuctionStatsChart";
import type { AuctionHistoryItem } from "@/components/dashboard/AuctionHistoryList";

export default function AuctionHistoryPage() {
  const { address } = useAccount();
  const [auctions, setAuctions] = useState<AuctionHistoryItem[]>([]);
  const { handleWithdraw, isWithdrawing } = useWithdraw();
  const { handleSettle, settlingId } = useSettleAuctionAction();
  const { pendingAmount, loading: pendingLoading } = usePendingReturns();

  useEffect(() => {
    if (!address) return;
    (async () => {
      const res = await getUserAuctionHistory(address);
      setAuctions(res.auctions);
    })();
  }, [address]);

  // Chart data: wins, losses, total
  const chartData = [
    { name: "Wins", value: auctions.filter((a: AuctionHistoryItem) => a.won).length },
    { name: "Losses", value: auctions.filter((a: AuctionHistoryItem) => !a.won).length },
    { name: "Total", value: auctions.length },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Auction History</h1>
      <PendingAmountCard
        pendingAmount={pendingAmount}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing || pendingLoading}
      />
      <AuctionStatsChart data={chartData} />
      <AuctionHistoryList
        auctions={auctions}
        onSettle={(auctionId, tokenId) => {
          const winnerId = auctions.find((a: AuctionHistoryItem) => a.auction.id === auctionId)?.auction.highestBidderId;
          if (winnerId) handleSettle(auctionId, tokenId, winnerId);
        }}
        settlingId={settlingId}
      />
    </div>
  );
}
