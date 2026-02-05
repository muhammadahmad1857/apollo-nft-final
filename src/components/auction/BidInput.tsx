"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConnection } from "wagmi";

export function BidInput({ onPlaceBid,isDisabled }: { onPlaceBid: (bidEth: string) => void,isDisabled:boolean }) {
  const [bid, setBid] = useState("");
  const {isConnected, isConnecting} = useConnection()

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        placeholder="Your bid in APOLLO"
        value={bid}
        onChange={(e) => setBid(e.target.value)}
      />
      <Button disabled={isDisabled || (!isConnected && !isConnecting)} onClick={() =>{ 
        if(isDisabled) return
        onPlaceBid(bid)
        }
        }>Place Bid</Button>
    </div>
  );
}
