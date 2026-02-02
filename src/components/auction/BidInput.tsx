"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BidInput({ onPlaceBid,isDisabled }: { onPlaceBid: (bidEth: string) => void,isDisabled:boolean }) {
  const [bid, setBid] = useState("");

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        placeholder="Your bid in ETH"
        value={bid}
        onChange={(e) => setBid(e.target.value)}
      />
      <Button disabled={isDisabled} onClick={() =>{ 
        if(isDisabled) return
        onPlaceBid(bid)
        }
        }>Place Bid</Button>
    </div>
  );
}
