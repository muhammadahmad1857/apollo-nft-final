"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BidInput({ onPlaceBid }: { onPlaceBid: (bidEth: string) => void }) {
  const [bid, setBid] = useState("");

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        placeholder="Your bid in ETH"
        value={bid}
        onChange={(e) => setBid(e.target.value)}
      />
      <Button onClick={() => onPlaceBid(bid)}>Place Bid</Button>
    </div>
  );
}
