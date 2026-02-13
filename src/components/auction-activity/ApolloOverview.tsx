// components/auction-history/ApolloOverview.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { auctionAddress, auctionABIArray } from "@/lib/wagmi/contracts";
import { AuctionHistory } from "@/types";

interface ApolloOverviewProps {
  auctionHistory?: AuctionHistory[]; // pass from main page
}

export default function ApolloOverview({ auctionHistory = [] }: ApolloOverviewProps) {
  const { address } = useAccount();

  /** ---------------------------------------
   * Withdraw logic
   * -------------------------------------- */
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { writeContract: withdrawWrite, data: withdrawTx } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess, error: withdrawReceiptError } =
    useWaitForTransactionReceipt({ hash: withdrawTx });

  const handleWithdraw = async () => {
    if (!address) return;
    setIsWithdrawing(true);
    try {
      withdrawWrite({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "withdraw",
      });
      toast.info("Withdrawal transaction sent...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  /** ---------------------------------------
   * Pending Apollo read
   * -------------------------------------- */
  const { data: pendingApolloRaw, refetch: refetchPending } = useReadContract({
    address: auctionAddress,
    abi: auctionABIArray,
    functionName: "pendingReturns",
    args: [address],
  });

  const pendingApollo = pendingApolloRaw
    ? Number(pendingApolloRaw) / 1e18 // convert from wei-like units
    : 0;

  /** ---------------------------------------
   * Derived stats from auctionHistory
   * -------------------------------------- */
  const now = new Date();
  const auctionsWon = auctionHistory.filter(
    (a) => a.status !== "active" && a.auction.highestBidderId === a.auction.nft.ownerId // optional fix depending on schema
  ).length;

  const activeAuctions = auctionHistory.filter((a) => a.status === "active").length;
  const totalBids = auctionHistory.reduce((acc, a) => {
    const userBidCount = a.auction.bids.filter((b) => b.bidderId === a.auction.nft.ownerId).length;
    return acc + userBidCount;
  }, 0);

  /** ---------------------------------------
   * Watch withdrawal lifecycle
   * -------------------------------------- */
  useEffect(() => {
    if (isWithdrawConfirming) toast.loading("Waiting for withdrawal confirmation...");
    if (withdrawSuccess) {
      toast.success("💸 Withdrawal successful!");
      refetchPending?.();
    }
    if (withdrawReceiptError) toast.error(withdrawReceiptError?.message || "Withdrawal failed");
  }, [isWithdrawConfirming, withdrawSuccess, withdrawReceiptError, refetchPending]);

  /** ---------------------------------------
   * Render
   * -------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Auction Activity 🪐</h1>
          <p className="text-muted-foreground">Track all auctions you participated in.</p>
        </div>
        {/* <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || isWithdrawConfirming || pendingApollo === 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isWithdrawing || isWithdrawConfirming ? "Withdrawing..." : "Withdraw Apollo 💸"}
        </Button> */}
      </div>

      {/* Stats Boxes */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Pending Apollo</span>
          <span className="text-xl font-bold text-orange-600">{pendingApollo.toFixed(2)}</span>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Auctions Won</span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{auctionsWon}</span>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Active Bids</span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{activeAuctions}</span>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow flex flex-col items-center">
          <span className="text-sm text-muted-foreground">Total Bids</span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{totalBids}</span>
        </div>
      </div>
    </div>
  );
}
