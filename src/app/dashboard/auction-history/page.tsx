import { getUserAuctionHistory } from "@/actions/auction-history";
import { PendingAmountCard } from "@/components/dashboard/PendingAmountCard";
import { AuctionHistoryList } from "@/components/dashboard/AuctionHistoryList";
import { AuctionStatsChart } from "@/components/dashboard/AuctionStatsChart";
import { useAccount } from "wagmi";
import { useWithdraw } from "@/hooks/useWithdraw";
import { useSettleAuctionAction } from "@/hooks/useSettleAuctionAction";
import { useEffect, useState } from "react";
//
import type { AuctionHistoryItem } from "@/components/dashboard/AuctionHistoryList";

export default function AuctionHistoryPage() {
  const { address } = useAccount();
  const [data, setData] = useState<{ auctions: AuctionHistoryItem[]; pendingAmount: number }>({ auctions: [], pendingAmount: 0 });
  const { handleWithdraw, isWithdrawing } = useWithdraw();
  const { handleSettle, settlingId } = useSettleAuctionAction();

  useEffect(() => {
    if (!address) return;
    (async () => {
      const res = await getUserAuctionHistory(address);
      setData(res);
    })();
  }, [address]);

  // Chart data: wins, losses, total
  const chartData = [
    { name: "Wins", value: data.auctions.filter((a) => a.won).length },
    { name: "Losses", value: data.auctions.filter((a) => !a.won).length },
    { name: "Total", value: data.auctions.length },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Auction History</h1>
      <PendingAmountCard
        pendingAmount={data.pendingAmount}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
      />
      <AuctionStatsChart data={chartData} />
      <AuctionHistoryList
        auctions={data.auctions}
        onSettle={(auctionId, tokenId) => {
          const winnerId = data.auctions.find((a) => a.auction.id === auctionId)?.auction.highestBidderId;
          if (winnerId) handleSettle(auctionId, tokenId, winnerId);
        }}
        settlingId={settlingId}
      />
    </div>
  );
}
