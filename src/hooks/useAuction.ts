/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWriteContract, useReadContract } from "wagmi";
import { auctionABIArray, auctionAddress } from "@/lib/wagmi/contracts";
import { toast } from "sonner";
import { parseEther } from "viem";

// Create Auction
export function useCreateAuction() {
  const { writeContractAsync, isPending } = useWriteContract();

  const createAuction = async (tokenId: bigint, durationSec: bigint, minBidEth: string) => {
    try {
      const tx = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "createAuction",
        args: [tokenId, durationSec, parseEther(minBidEth)],
      });
      toast.info("Transaction sent. Waiting for confirmation...");
      
      return tx;
    } catch (err: any) {
      toast.error(err?.message || "Failed to create auction");
      throw err;
    }
  };

  return { createAuction, isPending };
}

// Place Bid
export function usePlaceBid() {
  const { writeContractAsync, isPending } = useWriteContract();

  const placeBid = async (tokenId: bigint, bidEth: string) => {
    try {
      const tx = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "bid",
        args: [tokenId],
        value: parseEther(bidEth),
      });
      toast.info("Bid transaction sent!");
      return tx;
    } catch (err: any) {
      toast.error(err?.message || "Failed to place bid");
      throw err;
    }
  };

  return { placeBid, isPending };
}

// Settle Auction
export function useSettleAuction() {
  const { writeContractAsync, isPending } = useWriteContract();

  const settleAuction = async (tokenId: bigint) => {
    try {
      const tx = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "settle",
        args: [tokenId],
      });
      toast.info("Settling auction...");
      return tx;
    } catch (err: any) {
      toast.error(err?.message || "Failed to settle auction");
      throw err;
    }
  };

  return { settleAuction, isPending };
}

// Read Auction Details
export function useAuctionDetails(tokenId: bigint) {
  return useReadContract({
    address: auctionAddress,
    abi: auctionABIArray,
    functionName: "auctions",
    args: [tokenId],
  });
}
