"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConnection } from "wagmi";

export function BidInput({ onPlaceBid, isDisabled, minBid }: { onPlaceBid: (bidEth: string) => void, isDisabled: boolean, minBid: number }) {
  const [bid, setBid] = useState("");
  const [error, setError] = useState("");
  const { isConnected, isConnecting } = useConnection();

  const handleBid = () => {
    if (isDisabled) return;
    const bidValue = parseFloat(bid);
    if (isNaN(bidValue) || bidValue < minBid) {
      setError(`Bid must be at least ${minBid} APOLLO`);
      return;
    }
    setError("");
    onPlaceBid(bid);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          placeholder={`Your bid in APOLLO (min ${minBid})`}
          value={bid}
          min={minBid}
          onChange={(e) => {
            setBid(e.target.value);
            setError("");
          }}
        />
        <Button
          disabled={isDisabled || (!isConnected && !isConnecting)}
          onClick={handleBid}
        >
          Place Bid
        </Button>
      </div>
      {error && <span className="text-xs text-red-500 font-medium mt-1">{error}</span>}
    </div>
  );
}
