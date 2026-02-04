/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { nftAddress, auctionAddress, nftABIArray } from "@/lib/wagmi/contracts";
import { approveAuctionNFT } from "@/actions/nft";

interface ApproveButtonProps {
  nftId: number;
  disabled?: boolean;
  tokenId:number;
  onSuccess?: () => void;
}

export function ApproveAuctionButton({ nftId, disabled = false, onSuccess,tokenId }: ApproveButtonProps) {
  const toastIdRef = useRef<string | number | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const { writeContract: approveForAllWrite, data: approveTx } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess, error: approveReceiptError } =
    useWaitForTransactionReceipt({ hash: approveTx });

  const handleApproveAuction = useCallback(async () => {
    setIsApproving(true);
    try {
      approveForAllWrite({
        address: nftAddress,
        abi: nftABIArray,
        functionName: "approve",
        args: [auctionAddress, BigInt(tokenId)],
      });
      toast.info("Approval transaction sent...");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  }, [approveForAllWrite, tokenId]);

  /** Watch lifecycle and trigger backend */
  useEffect(() => {
    if (isApproveConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Waiting for approval confirmation...");
    }

    if (approveSuccess && toastIdRef.current) {
      approveAuctionNFT(nftId).catch(() => {});
      toast.success("✅ Approved for auction", { id: toastIdRef.current });
      toastIdRef.current = null;
      if (onSuccess) onSuccess();
    }

    if (approveReceiptError && toastIdRef.current) {
      toast.error(approveReceiptError?.message || "Approval failed or canceled by You.", { id: toastIdRef.current });
      toastIdRef.current = null;
    }
  }, [isApproveConfirming, approveSuccess, approveReceiptError, nftId, onSuccess]);

  return (
    <Button
      onClick={handleApproveAuction}
      disabled={disabled || isApproving || isApproveConfirming}
      className="w-full bg-cyan-600 hover:bg-cyan-700"
    >
      {isApproving || isApproveConfirming ? "Approving..." : "Approve for Auction"}
    </Button>
  );
}
