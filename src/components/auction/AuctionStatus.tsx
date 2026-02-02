"use client";

import { AuctionModel } from "@/generated/prisma/models";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AuctionStatus({ auction }: { auction: AuctionModel}) {
  const ended = new Date() >= new Date(auction.endTime);
  const highestBid = auction.highestBid || auction.minBid;

  return (
    <div className="p-4  rounded flex justify-between items-center">
      <p>Status: {ended ? "Ended" : "Active"}</p>
      <p>Current Highest Bid: {highestBid} ETH</p>
    </div>
  );
}
