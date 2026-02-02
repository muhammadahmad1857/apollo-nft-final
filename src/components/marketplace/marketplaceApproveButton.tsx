/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  nftAddress,
  marketplaceAddress,
  nftABIArray,
} from "@/lib/wagmi/contracts";
import { approveMarketNFT } from "@/actions/nft";

interface ApproveMarketButtonProps {
    nftId: number;
  disabled?: boolean;
  onSuccess?: () => void;
  tokenId:number
}

export function ApproveMarketButton({
    nftId,
  disabled = false,
  tokenId,
  onSuccess,
}: ApproveMarketButtonProps) {
  const toastIdRef = useRef<string | number | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  const handleApproveMarket = useCallback(async () => {
    try {
      const hash = await writeContractAsync({
        address: nftAddress,
        abi: nftABIArray,
        functionName: "approve",
        args: [marketplaceAddress, BigInt(tokenId)],
      });

      setTxHash(hash);
      toastIdRef.current = toast.loading(
        "Waiting for marketplace approval confirmation..."
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err?.shortMessage || err?.message || "Approval failed");
    }
  }, [writeContractAsync]);

  /* -----------------------------
     TX Lifecycle
  ------------------------------ */
  useEffect(() => {
    if (!txHash) return;

    if (isSuccess && toastIdRef.current) {
      approveMarketNFT(nftId).catch(() => {
        // silently fail DB sync (chain is source of truth)
        
      });

      toast.success("✅ Approved for marketplace", {
        id: toastIdRef.current,
      });

      toastIdRef.current = null;
      setTxHash(undefined);
      onSuccess?.();
    }

    if (error && toastIdRef.current) {
      toast.error(error.message || "Approval failed", {
        id: toastIdRef.current,
      });
      toastIdRef.current = null;
      setTxHash(undefined);
    }
  }, [isSuccess, error, txHash, nftId, onSuccess]);

  return (
    <Button
      onClick={handleApproveMarket}
      disabled={disabled || isConfirming}
      className="w-full bg-green-600 hover:bg-green-700"
    >
      {isConfirming ? "Approving..." : "Approve for Marketplace"}
    </Button>
  );
}
