"use client";

import { AuctionModel } from "@/generated/prisma/models";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AuctionStatus({ auction, auctionOnChain }: { auction: AuctionModel,auctionOnChain:any}) {
  const ended = new Date() >= new Date(auction.endTime);
  const highestBid = auctionOnChain?.highestBid ? Number(auctionOnChain.highestBid) / 1e18 : auction.minBid;

  return (
    <div className="p-4  rounded flex justify-between items-center">
      <p>Status: {ended ? "Ended" : "Active"}</p>
      <p>Current Highest Bid: {highestBid} ETH</p>
    </div>
  );
}
