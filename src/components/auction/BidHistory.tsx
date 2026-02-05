"use client";

import { BidModel, UserModel } from "@/generated/prisma/models";

export function BidHistory({ bids }: { bids: (BidModel & { bidder: UserModel })[] }) {
  if (!bids.length)
    return (
      <p className="text-gray-500 dark:text-gray-400 italic">No bids yet</p>
    );

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-4">
        Bid History
      </h3>

      <ul className="space-y-2">
        {bids.map((bid) => (
          <li
            key={bid.id}
            className="flex justify-between items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <span className="text-gray-800 dark:text-gray-200 font-medium">
              {bid.bidder.walletAddress}
            </span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
              {bid.amount} APOLLO
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
