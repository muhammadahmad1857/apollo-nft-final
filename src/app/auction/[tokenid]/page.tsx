/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuctionDetails, usePlaceBid, useSettleAuction } from "@/hooks/useAuction";
import { getAuctionByNFT, } from "@/actions/auction";
import { AuctionDetails } from "@/components/auction/AuctionDetails";
import { BidHistory } from "@/components/auction/BidHistory";
import { BidInput } from "@/components/auction/BidInput";
import { AuctionStatus } from "@/components/auction/AuctionStatus";
import { getBidsByAuctionWithUser } from "@/actions/bid";


export default function AuctionPage() {
  const params = useParams();
  const tokenId = BigInt(String(params.tokenId));

  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const router = useRouter();

  const { data: auctionOnChain } = useAuctionDetails(tokenId);
  const { placeBid } = usePlaceBid();
  const { settleAuction } = useSettleAuction();

  useEffect(() => {
    async function fetchData() {
      const auctionDB = await getAuctionByNFT(Number(tokenId));
      const bidList = await getBidsByAuctionWithUser(Number(tokenId));
      setAuction(auctionDB);
      setBids(bidList);
    }
    fetchData();
  }, [tokenId]);

  const handlePlaceBid = async (bidEth: string) => {
    try {
      if (!auction) return;
      const txHash = await placeBid(tokenId, bidEth);
      toast.info("Bid transaction sent!");
      // you can also wait for confirmation here if you want
      // refresh bids
      const bidList = await getBidsByAuctionWithUser(Number(tokenId));
      setBids(bidList);
    } catch (err: any) {
      toast.error(err?.message || "Failed to place bid");
    }
  };

  const handleSettle = async () => {
    try {
      const txHash = await settleAuction(tokenId);
      toast.info("Settling auction...");
      // refresh auction status after settle
      const updatedAuction = await getAuctionByNFT(Number(tokenId));
      setAuction(updatedAuction);
      toast.success("Auction settled!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to settle auction");
    }
  };

  if (!auction) return <div className="p-10 text-center">Loading auction...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <AuctionDetails auction={auction} onSettle={handleSettle} />
      <AuctionStatus auction={auction} auctionOnChain={auctionOnChain} />
      <BidInput onPlaceBid={handlePlaceBid} />
      <BidHistory bids={bids} />
    </div>
  );
}
