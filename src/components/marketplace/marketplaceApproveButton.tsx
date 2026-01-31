/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { nftAddress, marketplaceAddress, nftABIArray } from "@/lib/wagmi/contracts";
import { approveMarketUser } from "@/actions/users"; // backend call for market approval

interface ApproveMarketButtonProps {
  userId: number;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function ApproveMarketButton({ userId, disabled = false, onSuccess }: ApproveMarketButtonProps) {
  const toastIdRef = useRef<string | number | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const { writeContract: approveForAllWrite, data: approveTx } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess, error: approveReceiptError } =
    useWaitForTransactionReceipt({ hash: approveTx });

  const handleApproveMarket = useCallback(async () => {
    setIsApproving(true);
    try {
      approveForAllWrite({
        address: nftAddress,
        abi: nftABIArray,
        functionName: "setApprovalForAll",
        args: [marketplaceAddress, true],
      });
      toast.info("Approval transaction sent...");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  }, [approveForAllWrite]);

  /** Watch lifecycle and trigger backend */
  useEffect(() => {
    if (isApproveConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Waiting for market approval confirmation...");
    }

    if (approveSuccess && toastIdRef.current) {
      approveMarketUser(userId).catch(() => {});
      toast.success("✅ Approved for marketplace", { id: toastIdRef.current });
      toastIdRef.current = null;
      if (onSuccess) onSuccess();
    }

    if (approveReceiptError && toastIdRef.current) {
      toast.error(approveReceiptError?.message || "Approval failed", { id: toastIdRef.current });
      toastIdRef.current = null;
    }
  }, [isApproveConfirming, approveSuccess, approveReceiptError, userId, onSuccess]);

  return (
    <Button
      onClick={handleApproveMarket}
      disabled={disabled || isApproving || isApproveConfirming}
      className="w-full bg-green-600 hover:bg-green-700"
    >
      {isApproving || isApproveConfirming ? "Approving..." : "Approve for Marketplace"}
    </Button>
  );
}
