/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useAuctionDetails,
  usePlaceBid,
  useSettleAuction,
} from "@/hooks/useAuction";
import { getAuctionByNFT } from "@/actions/auction";
import { AuctionDetails } from "@/components/auction/AuctionDetails";
import { BidHistory } from "@/components/auction/BidHistory";
import { BidInput } from "@/components/auction/BidInput";
import { AuctionStatus } from "@/components/auction/AuctionStatus";
import { getBidsByAuctionWithUser } from "@/actions/bid";
import {
  AuctionModel,
  BidModel,
  NFTModel,
  UserModel,
} from "@/generated/prisma/models";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";

export default function AuctionPage() {
  const params = useParams();
  const nftId = Number(params.tokenid);

  const router = useRouter();
  const { address } = useAccount();
  const { data: user } = useUser(address || "");

  const [auction, setAuction] = useState<
    | (AuctionModel & {
        seller: UserModel;
        nft: NFTModel;
        highestBidder: UserModel | null;
        bids: BidModel[];
      })
    | null
  >(null);

  const [bids, setBids] = useState<(BidModel & {bidder:UserModel})[]>([]);

  // ✅ tokenId derived safely
  const tokenId = auction?.nft?.tokenId;

  // ✅ SAFE hook usage (only runs when tokenId exists)
  const { data: auctionOnChain } = useAuctionDetails(
    tokenId !== undefined ? BigInt(tokenId) : BigInt(0)
  );

  const { placeBid } = usePlaceBid();
  const { settleAuction } = useSettleAuction();

  /* -----------------------------
     Fetch DB data
  ------------------------------ */
  useEffect(() => {
    if (!nftId) return;

    async function fetchData() {
      try {
        const auctionDB = await getAuctionByNFT(nftId);
        if (!auctionDB?.nft?.tokenId) return;

        const bidList = await getBidsByAuctionWithUser(nftId);

        setAuction(auctionDB);
        setBids(bidList);
      } catch (err) {
        toast.error("Failed to load auction");
      }
    }

    fetchData();
  }, [nftId]);

  /* -----------------------------
     Actions
  ------------------------------ */
  const handlePlaceBid = async (bidEth: string) => {
    if (!auction || tokenId === undefined || !user?.id) return;

    try {
      await placeBid(
        BigInt(tokenId),
        bidEth,
        auction.id,
        user.id
      );

      toast.info("Bid transaction sent");

      const bidList = await getBidsByAuctionWithUser(nftId);
      setBids(bidList);
    } catch (err: any) {
      toast.error(err?.message || "Failed to place bid");
    }
  };

  const handleSettle = async () => {
    if (!auction || tokenId === undefined) return;

    try {
      await settleAuction(BigInt(tokenId), auction.id);

      const updatedAuction = await getAuctionByNFT(nftId);
      setAuction(updatedAuction);

      toast.success("Auction settled");
    } catch (err: any) {
      toast.error(err?.message || "Failed to settle auction");
    }
  };

  /* -----------------------------
     Loading state
  ------------------------------ */
  if (!auction || tokenId === undefined) {
    return <div className="p-10 text-center">Loading auction...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <AuctionDetails auction={auction} onSettle={handleSettle} />
      <AuctionStatus auction={auction} auctionOnChain={auctionOnChain} />
      <BidInput onPlaceBid={handlePlaceBid} />
      <BidHistory bids={bids} />
    </div>
  );
}
