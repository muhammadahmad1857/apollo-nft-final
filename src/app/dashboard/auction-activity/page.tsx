// app/auction-history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { getAuctionHistory } from "@/actions/auction-history";
import { AuctionHistory as AuctionHistoryType } from "@/types";
import { useUser } from "@/hooks/useUser";

// Components
import AuctionTabs from "@/components/auction-activity/AuctionTabs";
import ApolloOverview from "@/components/auction-activity/ApolloOverview";
import AuctionList from "@/components/auction-activity/AuctionList";
import AuctionCharts from "@/components/auction-activity/AucionChart";

export default function AuctionHistoryPage() {
  const { address, isConnected } = useAccount();
  const { data: user } = useUser(address || "");
  const userId = user?.id || 0;

  const [auctionHistory, setAuctionHistory] = useState<AuctionHistoryType[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<AuctionHistoryType[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch history when address changes
  useEffect(() => {
    if (!address) return;

    setLoading(true);
    getAuctionHistory(address)
      .then((data) => {
        setAuctionHistory(data);
        setFilteredAuctions(data); // default = all
      })
      .catch((err) => {
        console.error("Failed to fetch auction history:", err);
      })
      .finally(() => setLoading(false));
  }, [address]);

  if (!isConnected)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Connect your wallet to view your auction history.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Apollo Dashboard / Overview */}
      <ApolloOverview auctionHistory={auctionHistory} />

      {/* Charts */}
      <AuctionCharts auctionHistory={auctionHistory} />

      {/* Tabs: All | Active | Ended | Won | Lost */}
      <AuctionTabs
        auctionHistory={auctionHistory}
        userId={userId}
        onTabChange={(filtered) => setFilteredAuctions(filtered)}
      />

      {/* Auction List */}
      <AuctionList auctions={filteredAuctions} loading={loading} userId={userId} />
    </div>
  );
}
