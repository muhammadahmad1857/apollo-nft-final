/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { nftAddress, auctionAddress, auctionABIArray, marketplaceAddress } from "@/lib/wagmi/contracts";
import { useUser } from "@/hooks/useUser";
import { ApproveAuctionButton } from "@/components/auction/ApproveButton";
import { ApproveMarketButton } from "@/components/marketplace/marketplaceApproveButton"; // new market button

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
    <div className="max-w-lg mx-auto p-6 space-y-6">
      {/* User Info Card */}
      <Card>
        <CardHeader className="flex flex-col items-center">
          <Avatar className="w-28 h-28 mb-4">
            <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
          <div className="text-muted-foreground break-all">{user.walletAddress}</div>
        </CardHeader>

        <CardContent className="space-y-4 mt-4">
          {/* Withdraw Button */}
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawing || isWithdrawConfirming}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isWithdrawing || isWithdrawConfirming ? "Withdrawing..." : "Withdraw"}
          </Button>

          {/* Approve Auction Section */}
          {!user.approvedAuction ? (
            <ApproveAuctionButton
              userId={user.id}
              onSuccess={() => {
                if (refetch) refetch();
              }}
            />
          ) : (
            <div className="text-green-600 font-semibold text-center">
              ✅ Approved for Auctions
            </div>
          )}

          {/* Approve Market Section */}
          {!user.approvedMarket ? (
            <ApproveMarketButton
              userId={user.id}
              onSuccess={() => {
                if (refetch) refetch();
              }}
            />
          ) : (
            <div className="text-blue-600 font-semibold text-center">
              ✅ Approved for Marketplace
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
