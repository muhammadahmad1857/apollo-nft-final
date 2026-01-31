"use client";

import { BidModel, UserModel } from "@/generated/prisma/models";

export function BidHistory({ bids }: { bids: (BidModel &{bidder: UserModel})[] }) {
  if (!bids.length) return <p>No bids yet</p>;

  return (
    <div className="p-4 bg-white shadow rounded">
      <h3 className="font-bold mb-2">Bid History</h3>
      <ul className="space-y-1">
        {bids.map((bid) => (
          <li key={bid.id} className="flex justify-between">
            <span>{bid.bidder.name || bid.bidder.walletAddress}</span>
            <span>{bid.amount} ETH</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
