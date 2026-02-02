/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import { auctionABIArray, auctionAddress } from "@/lib/wagmi/contracts";
import {
  createAuction as createAuctionDB,
  updateHighestBid,
  settleAuction as settleAuctionDB,
} from "@/actions/auction";
import { useRouter } from "next/navigation";
import { BaseError } from "abitype";
import { createBid } from "@/actions/bid";
import { transferOwnership } from "@/actions/nft";
import { useUser } from "./useUser";

/* ======================================================
   CREATE AUCTION
====================================================== */
export function useCreateAuction() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const toastIdRef = useRef<string | number | null>(null);
  const router = useRouter();
  const { isSuccess, isLoading, isError, error } = useWaitForTransactionReceipt(
    { hash: txHash, confirmations: 1 },
  );

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
    nftId: number,
  ) => {
    try {
      toastIdRef.current = toast.loading("Creating auction on blockchain...");

      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "createAuction",
        args: [tokenId, durationSec, parseEther(minBidEth)],
      });

      setPendingData({ sellerId, nftId, durationSec, minBidEth });
      setTxHash(hash);

      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage || "Failed to create auction", {
        id: toastIdRef.current ?? undefined,
      });
      throw err;
    }
  };

  useEffect(() => {
    if (isError && toastIdRef.current) {
      toast.error(
        (error as BaseError)?.shortMessage ||
          error?.message ||
          "Transaction failed",
        { id: toastIdRef.current },
      );
    }
  }, [isError, error]);

  useEffect(() => {
    if (!isSuccess || !pendingData) return;

    (async () => {
      try {
        await createAuctionDB({
          nft: { connect: { id: pendingData.nftId, isListed: true } },
          seller: { connect: { id: pendingData.sellerId } },
          minBid: Number(pendingData.minBidEth),
          startTime: new Date(),
          endTime: new Date(
            Date.now() + Number(pendingData.durationSec) * 1000,
          ),
          settled: false,
        });

        toast.success("Auction created successfully 🎉", {
          id: toastIdRef.current ?? undefined,
        });
        router.push(`/auction/${pendingData.nftId}`);
      } catch {
        toast.error("Auction confirmed but DB sync failed", {
          id: toastIdRef.current ?? undefined,
        });
      }
    })();
  }, [isSuccess]);

  return { createAuction, isPending: isLoading };
}

/* ======================================================
   PLACE BID
====================================================== */

export function usePlaceBid() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const toastIdRef = useRef<string | number | null>(null);

  const { isSuccess, isLoading, isError, error } = useWaitForTransactionReceipt(
    {
      hash: txHash,
      confirmations: 1,
    },
  );

  const [pendingData, setPendingData] = useState<{
    tokenId: bigint;
    auctionId: number;
    bidderId: number;
    bidEth: string;
  } | null>(null);

  const placeBid = async (
    tokenId: bigint,
    bidEth: string,
    auctionId: number,
    bidderId: number,
  ) => {
    try {
      toastIdRef.current = toast.loading("Placing bid on blockchain...");

      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "bid",
        args: [tokenId],
        value: parseEther(bidEth),
      });

      setPendingData({ tokenId, auctionId, bidderId, bidEth });
      setTxHash(hash);
      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || "Bid failed", {
        id: toastIdRef.current ?? undefined,
      });
      throw err;
    }
  };

  // Handle on-chain transaction error
  useEffect(() => {
    if (isError && toastIdRef.current) {
      const msg = (error as BaseError)?.shortMessage || error?.message;
      toast.error(msg || "Transaction failed", { id: toastIdRef.current });
    }
  }, [isError, error]);

  // After transaction success, create bid in DB
  useEffect(() => {
    if (!isSuccess || !pendingData) return;

    (async () => {
      try {
        await createBid({
          auction: { connect: { id: pendingData.auctionId } },
          bidder: { connect: { id: pendingData.bidderId } },
          amount: Number(pendingData.bidEth),
        });

        toast.success("Bid placed successfully 🔥", {
          id: toastIdRef.current ?? undefined,
        });
      } catch (err) {
        console.error(err);
        toast.error("Bid confirmed on-chain but DB update failed", {
          id: toastIdRef.current ?? undefined,
        });
      }
    })();
  }, [isSuccess, pendingData]);

  return { placeBid, isPending: isLoading };
}

/* ======================================================
   SETTLE AUCTION
====================================================== */
export function useSettleAuction() {
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const toastIdRef = useRef<string | number | null>(null);
  const [pendingAuctionId, setPendingAuctionId] = useState<number | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const { isSuccess, isLoading, isError, error } = useWaitForTransactionReceipt(
    { hash: txHash, confirmations: 1 },
  );
  const { address } = useAccount();
  const { data: user, isLoading: userLoading } = useUser(address);

  const settleAuction = async (tokenId: bigint, auctionId: number) => {
    try {
      toastIdRef.current = toast.loading("Settling auction...");
      setTokenId(Number(tokenId));
      const hash = await writeContractAsync({
        address: auctionAddress,
        abi: auctionABIArray,
        functionName: "settle",
        args: [tokenId],
      });

      setPendingAuctionId(auctionId);
      setTxHash(hash);

      return hash;
    } catch (err: any) {
      toast.error(err?.shortMessage || "Settlement failed", {
        id: toastIdRef.current ?? undefined,
      });
      throw err;
    }
  };

  useEffect(() => {
    if (isError && toastIdRef.current) {
      toast.error(
        (error as BaseError)?.shortMessage ||
          error?.message ||
          "Transaction failed",
        { id: toastIdRef.current },
      );
    }
  }, [isError, error]);

  useEffect(() => {
    if (!isSuccess || !pendingAuctionId) return;

    (async () => {
      try {
        if (!tokenId || !user?.id) throw new Error("Something went wrong!!");
        await settleAuctionDB(pendingAuctionId);
        await transferOwnership(tokenId, user.id);
        toast.success("Auction settled successfully ✅", {
          id: toastIdRef.current ?? undefined,
        });
      } catch {
        toast.error("Auction settled on-chain but DB sync failed", {
          id: toastIdRef.current ?? undefined,
        });
      }
    })();
  }, [isSuccess, pendingAuctionId, user]);

  return { settleAuction, isPending: isLoading };
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
