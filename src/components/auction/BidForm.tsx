"use client"
import { useAuction } from "@/hooks/useAuction";
import { useState } from "react";

interface BidFormProps {
  auction: {
    tokenId: number;
    highestBid?: number;
    minBid: number;
  };
}

export default function BidForm({ auction }: BidFormProps) {
  const { bid, isBusy, handleToasts } = useAuction();
  const [amount, setAmount] = useState("");

  // Call handleToasts in effect (not shown here)

  const handleBid = () => {
    if (!amount) return;
    // Convert ETH to wei (bigint)
    bid({ tokenId: auction.tokenId, amount: BigInt(Math.floor(Number(amount) * 1e18)) });
  };

  return (
    <div className="flex gap-2 items-center mt-4">
      <input
        type="number"
        min={auction.highestBid ? auction.highestBid + 0.01 : auction.minBid}
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="px-3 py-2 rounded bg-gray-800 text-white w-32"
        disabled={isBusy}
        placeholder="Bid (ETH)"
      />
      <button
        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg shadow"
        disabled={isBusy}
        onClick={handleBid}
      >
        Place Bid
      </button>
    </div>
  );
}
