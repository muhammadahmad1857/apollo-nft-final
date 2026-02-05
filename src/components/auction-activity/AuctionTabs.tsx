// components/auction-history/AuctionTabs.tsx
"use client";

import React, { useState, useMemo } from "react";
import { AuctionHistory } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // shadcn tabs

interface AuctionTabsProps {
  auctionHistory: AuctionHistory[];
  onTabChange?: (filtered: AuctionHistory[]) => void; // optional callback
  userId: number;
}

const TAB_KEYS = ["all", "active", "ended", "won", "lost"] as const;
type TabKey = typeof TAB_KEYS[number];

export default function AuctionTabs({ auctionHistory, onTabChange, userId }: AuctionTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const now = new Date();

  const filteredAuctions = useMemo(() => {
    switch (activeTab) {
      case "active":
        return auctionHistory.filter((a) => a.status === "active");
      case "ended":
        return auctionHistory.filter((a) => a.status === "ended" || a.status === "settled");
      case "won":
        return auctionHistory.filter(
          (a) =>
            a.status !== "active" &&
            a.auction.highestBidderId === userId
        );
      case "lost":
        return auctionHistory.filter(
          (a) =>
            a.status !== "active" &&
            a.auction.highestBidderId !== userId
        );
      case "all":
      default:
        return auctionHistory;
    }
  }, [activeTab, auctionHistory, userId]);

  // Notify parent if needed
  useMemo(() => {
    if (onTabChange) onTabChange(filteredAuctions);
  }, [filteredAuctions, onTabChange]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val: string ) => setActiveTab(val as TabKey)}
      className="mb-4"
    >
      <TabsList className="grid grid-cols-5">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="ended">Ended</TabsTrigger>
        <TabsTrigger value="won">Won</TabsTrigger>
        <TabsTrigger value="lost">Lost</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>
        {/* This content is optional, we mostly just filter auctions */}
      </TabsContent>
    </Tabs>
  );
}
