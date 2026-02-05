// components/auction-history/AuctionCharts.tsx
"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AuctionHistory } from "@/types";

interface AuctionChartsProps {
  auctionHistory: AuctionHistory[];
}

const COLORS = ["#4ade80", "#f87171", "#facc15"]; // Won, Lost, Active

export default function AuctionCharts({ auctionHistory }: AuctionChartsProps) {
  /** -------------------------------
   * Chart A: Bid Activity Over Time
   * ------------------------------- */
  const bidActivityData = useMemo(() => {
    const counts: Record<string, number> = {};

    auctionHistory.forEach((a) => {
      a.auction.bids.forEach((b) => {
        const day = new Date(b.createdAt).toLocaleDateString();
        counts[day] = (counts[day] || 0) + 1;
      });
    });

    // Convert to array sorted by day
    return Object.keys(counts)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((day) => ({ day, bids: counts[day] }));
  }, [auctionHistory]);

  /** -------------------------------
   * Chart B: Auction Outcomes
   * ------------------------------- */
  const auctionOutcomeData = useMemo(() => {
    const now = new Date();
    let won = 0,
      lost = 0,
      active = 0;

    auctionHistory.forEach((a) => {
      if (a.status === "active") active++;
      else if (a.status === "ended") {
        if (a.auction.highestBidderId === a.auction.nft.ownerId) won++;
        else lost++;
      }
    });

    return [
      { name: "Won", value: won },
      { name: "Lost", value: lost },
      { name: "Active", value: active },
    ];
  }, [auctionHistory]);

  // Show nothing if no data
  if (!auctionHistory.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Chart A: Bid Activity Over Time */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-2">Bid Activity Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={bidActivityData}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="bids" stroke="#4ade80" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart B: Auction Outcomes */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
        <h2 className="text-lg font-bold mb-2">Auction Outcomes</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={auctionOutcomeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {auctionOutcomeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
