"use client";
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { auctionAddress, auctionABIArray } from "@/lib/wagmi/contracts";
import { toast } from "sonner";

export function useWithdraw() {
  const { writeContract, data: withdrawTx } = useWriteContract();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess, error: withdrawReceiptError } =
    useWaitForTransactionReceipt({ hash: withdrawTx });

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await writeContract({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "withdraw",
      });
      toast.info("Withdrawal transaction sent...");
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        toast.error((err as { message?: string }).message || "Withdrawal failed");
      } else {
        toast.error("Withdrawal failed");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    handleWithdraw,
    isWithdrawing: isWithdrawing || isWithdrawConfirming,
    withdrawSuccess,
    withdrawReceiptError,
  };
}
