/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { nftAddress, auctionAddress, nftABIArray, auctionABIArray } from "@/lib/wagmi/contracts";
import { useUser } from "@/hooks/useUser";
import { approveAuctionUser } from "@/actions/users";

export default function UserDetailsPage() {
  const { address } = useAccount();
  const { data: user, refetch } = useUser(address || "");

  const toastIdRef = useRef<string | number | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  /** ---------------------------------------
   * Approve for Auction
   * -------------------------------------- */
  const { writeContract: approveForAllWrite, data: approveTx, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess, error: approveReceiptError } = useWaitForTransactionReceipt({ hash: approveTx });

  const handleApproveAuction = useCallback(async () => {
    if (!user) return;
    setIsApproving(true);

    try {
      const tx =  approveForAllWrite({
        address: nftAddress,
        abi: nftABIArray,
        functionName: "setApprovalForAll",
        args: [auctionAddress, true],
      });
      toast.info("Approval transaction sent...");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  }, [approveForAllWrite, user]);

  /** watch lifecycle for toasts & backend update */
  useEffect(() => {
    if (isApproveConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Waiting for approval confirmation...");
    }

    if (approveSuccess && toastIdRef.current) {
      approveAuctionUser(user!.id).catch(() => {});
      toast.success("✅ Approved for auction", { id: toastIdRef.current });
      toastIdRef.current = null;
      if (refetch) refetch();
    }

    if (approveReceiptError && toastIdRef.current) {
      toast.error(approveReceiptError?.message || "Approval failed", { id: toastIdRef.current });
      toastIdRef.current = null;
    }

  }, [isApproveConfirming, approveSuccess, approveReceiptError, user, refetch]);

  /** ---------------------------------------
   * Withdraw ETH
   * -------------------------------------- */
  const { writeContract: withdrawWrite, data: withdrawTx, isPending: isWithdrawPending, error: withdrawError } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess, error: withdrawReceiptError } = useWaitForTransactionReceipt({ hash: withdrawTx });

  const handleWithdraw = useCallback(async () => {
    setIsWithdrawing(true);

    try {
      await withdrawWrite({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "withdraw",
      });
      toast.info("Withdrawal transaction sent...");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  }, [withdrawWrite]);

  /** watch lifecycle for withdraw */
  useEffect(() => {
    if (isWithdrawConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Waiting for withdrawal confirmation...");
    }

    if (withdrawSuccess && toastIdRef.current) {
      toast.success("💸 Withdrawal successful!", { id: toastIdRef.current });
      toastIdRef.current = null;
    }

    if (withdrawReceiptError && toastIdRef.current) {
      toast.error(withdrawReceiptError?.message || "Withdrawal failed", { id: toastIdRef.current });
      toastIdRef.current = null;
    }
  }, [isWithdrawConfirming, withdrawSuccess, withdrawReceiptError]);

  if (!user)
    return <div className="p-8 text-center text-muted-foreground">Connect your wallet to view your details.</div>;

  return (
    <div className="max-w-md mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-center">User Details</h1>

      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-xl font-bold">{user.name}</div>
        <div className="text-muted-foreground break-all">{user.walletAddress}</div>
      </div>

      <div className="space-y-4">
        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || isWithdrawPending || isWithdrawConfirming}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isWithdrawing || isWithdrawPending || isWithdrawConfirming
            ? "Withdrawing..."
            : "Withdraw"}
        </Button>

        {/* Approve for Auction */}
        {!user.approvedAuction && (
          <Button
            onClick={handleApproveAuction}
            disabled={isApproving || isApprovePending || isApproveConfirming}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            {isApproving || isApprovePending || isApproveConfirming
              ? "Approving..."
              : "Approve for Auction"}
          </Button>
        )}

        {user.approvedAuction && (
          <div className="text-green-600 font-semibold text-center">
            ✅ Approved for auctions
          </div>
        )}
      </div>
    </div>
  );
}
