"use client";
import { useState } from "react";
import { useSettleAuction } from "@/hooks/useAuction";
import { toast } from "sonner";

export function useSettleAuctionAction() {
  const { settleAuction, isPending } = useSettleAuction();
  const [settlingId, setSettlingId] = useState<number | null>(null);

  const handleSettle = async (auctionId: number, tokenId: number, winnerId: number) => {
    setSettlingId(auctionId);
    try {
      await settleAuction(BigInt(tokenId), auctionId, winnerId);
      toast.success("Auction settled!");
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        toast.error((err as { message?: string }).message || "Settlement failed");
      } else {
        toast.error("Settlement failed");
      }
    } finally {
      setSettlingId(null);
    }
  };

  return { handleSettle, settlingId, isPending };
}
