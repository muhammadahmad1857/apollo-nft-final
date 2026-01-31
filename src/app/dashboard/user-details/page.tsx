/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { nftAddress, auctionAddress, auctionABIArray } from "@/lib/wagmi/contracts";
import { useUser } from "@/hooks/useUser";
import { ApproveAuctionButton } from "@/components/auction/ApproveButton";

export default function UserDetailsPage() {
  const { address } = useAccount();
  const { data: user, refetch } = useUser(address || "");

  /** ---------------------------------------
   * Withdraw Button Logic
   * -------------------------------------- */
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { writeContract: withdrawWrite, data: withdrawTx } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess, error: withdrawReceiptError } =
    useWaitForTransactionReceipt({ hash: withdrawTx });

  const handleWithdraw = async () => {
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
  };

  /** Watch withdrawal lifecycle */
  if (isWithdrawConfirming) {
    toast.loading("Waiting for withdrawal confirmation...");
  }
  if (withdrawSuccess) {
    toast.success("💸 Withdrawal successful!");
    if (refetch) refetch();
  }
  if (withdrawReceiptError) {
    toast.error(withdrawReceiptError?.message || "Withdrawal failed");
  }

  /** ---------------------------------------
   * Render
   * -------------------------------------- */
  if (!user)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Connect your wallet to view your details.
      </div>
    );

  return (
    <div className="max-w-md mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-center">User Details</h1>

      {/* Avatar & Basic Info */}
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-xl font-bold">{user.name}</div>
        <div className="text-muted-foreground break-all">{user.walletAddress}</div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || isWithdrawConfirming}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isWithdrawing || isWithdrawConfirming ? "Withdrawing..." : "Withdraw"}
        </Button>

        {/* Approve Auction Button */}
        {!user.approvedAuction ? (
          <ApproveAuctionButton
            userId={user.id}
            onSuccess={() => {
              if (refetch) refetch();
            }}
          />
        ) : (
          <div className="text-green-600 font-semibold text-center">
            ✅ Approved for auctions
          </div>
        )}
      </div>
    </div>
  );
}
