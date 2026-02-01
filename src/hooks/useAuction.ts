/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";

import { auctionABIArray, auctionAddress } from "@/lib/wagmi/contracts";

// 👉 SERVER ACTIONS (DB)
import {
  createAuction as createAuctionDB,
  updateHighestBid,
  settleAuction as settleAuctionDB,
} from "@/actions/auction";
import { useRouter } from "next/router";

/* ======================================================
   CREATE AUCTION
====================================================== */
export function useCreateAuction() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const router = useRouter()
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  // store temp data until tx confirms
  const [pendingData, setPendingData] = useState<{
    sellerId: number;
    nftId: number;
    durationSec: bigint;
    minBidEth: string;
  } | null>(null);

  const createAuction = async (
    tokenId: bigint,
    durationSec: bigint,
    minBidEth: string,
    sellerId: number,
    nftId: number
  ) => {
    try {
      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "createAuction",
        args: [tokenId, durationSec, parseEther(minBidEth)],
      });

      setPendingData({ sellerId, nftId, durationSec, minBidEth });
      setTxHash(hash);

      toast.loading("Creating auction on blockchain...");
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage || "Failed to create auction");
      throw err;
    }
  };

  // 👉 DB sync after confirmation
  useEffect(() => {
    if (!isSuccess || !pendingData) return;

    (async () => {
      try {
        await createAuctionDB({
          nft: {connect:{id:pendingData.nftId}},
          seller: {connect:{id:pendingData.sellerId}},
          minBid: Number(pendingData.minBidEth),
          startTime: new Date(),
          endTime: new Date(
            Date.now() + Number(pendingData.durationSec) * 1000
          ),
          settled: false,
        });
router.push(`/auction/${pendingData.nftId}`)
        toast.success("Auction created successfully 🎉");
      } catch {
        toast.error("Auction confirmed but DB sync failed");
      }
    })();
  }, [isSuccess]);

  return {
    createAuction,
    isPending: isLoading,
  };
}

/* ======================================================
   PLACE BID
====================================================== */
export function usePlaceBid() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  const [pendingData, setPendingData] = useState<{
    auctionId: number;
    bidderId: number;
    bidEth: string;
  } | null>(null);

  const placeBid = async (
    tokenId: bigint,
    bidEth: string,
    auctionId: number,
    bidderId: number
  ) => {
    try {
      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "bid",
        args: [tokenId],
        value: parseEther(bidEth),
      });

      setPendingData({ auctionId, bidderId, bidEth });
      setTxHash(hash);

      toast.loading("Placing bid...");
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage || "Bid failed");
      throw err;
    }
  };

  useEffect(() => {
    if (!isSuccess || !pendingData) return;

    (async () => {
      try {
        await updateHighestBid(
          pendingData.auctionId,
          pendingData.bidderId,
          Number(pendingData.bidEth)
        );

        toast.success("Bid placed successfully 🔥");
      } catch {
        toast.error("Bid confirmed but DB update failed");
      }
    })();
  }, [isSuccess]);

  return {
    placeBid,
    isPending: isLoading,
  };
}

/* ======================================================
   SETTLE AUCTION
====================================================== */
export function useSettleAuction() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  const [pendingAuctionId, setPendingAuctionId] = useState<number | null>(null);

  const settleAuction = async (tokenId: bigint, auctionId: number) => {
    try {
      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "settle",
        args: [tokenId],
      });

      setPendingAuctionId(auctionId);
      setTxHash(hash);

      toast.loading("Settling auction...");
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage || "Settlement failed");
      throw err;
    }
  };

  useEffect(() => {
    if (!isSuccess || !pendingAuctionId) return;

    (async () => {
      try {
        await settleAuctionDB(pendingAuctionId);
        toast.success("Auction settled successfully ✅");
      } catch {
        toast.error("Auction settled on-chain but DB sync failed");
      }
    })();
  }, [isSuccess]);

  return {
    settleAuction,
    isPending: isLoading,
  };
}

/* ======================================================
   READ AUCTION (ON-CHAIN)
====================================================== */
export function useAuctionDetails(tokenId: bigint) {
  return useReadContract({
    address: auctionAddress,
    abi: auctionABIArray,
    functionName: "auctions",
    args: [tokenId],
  });
}
