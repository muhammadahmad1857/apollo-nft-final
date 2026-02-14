/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
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
import Loader from "@/components/loader";

export default function AuctionPage() {
  const params = useParams();
  const nftId = Number(params.tokenid);

  const auctionFacts = [
    "Auctions run on blockchain, making every bid transparent and verifiable!",
    "Fun fact: The highest bid wins the NFT through a smart contract settlement.",
    "Did you know? Auction timers are immutable and cannot be changed once started.",
    "Interesting: All bid history is permanently recorded on the blockchain!",
    "Fun fact: Auction settlement automatically transfers the NFT to the winner.",
    "Did you know? You can increase your bid at any time before the auction ends!",
    "Interesting: Failed auctions can be restarted with new bidding rules.",
    "Fun fact: The reserve/minimum bid ensures creators get fair value for their NFTs!",
  ];

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
  // const { data: auctionOnChain } = useAuctionDetails(
  //   tokenId !== undefined ? BigInt(tokenId) : BigInt(0)
  // );

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
        if (!auctionDB || !auctionDB.nft?.tokenId) {
          router.push("/auction");
          return;
        }
        const bidList = await getBidsByAuctionWithUser(auctionDB.id);
        console.log("bidlist",bidList)
        setAuction(auctionDB);
        setBids(bidList);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load auction");
      }
    }

    fetchData();
  }, [nftId,router]);

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

      const bidList = await getBidsByAuctionWithUser(auction.id);
      console.log("bidlist",bidList)
      setBids(bidList);
      router.refresh()

    } catch (err: any) {
      toast.error(err?.message || "Failed to place bid");
    }
  };

  const handleSettle = async () => {
    if (!auction || tokenId === undefined) return;

    try {
      await settleAuction(BigInt(tokenId), auction.id,auction.highestBidderId);

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
    return <Loader text="Loading Auction" facts={auctionFacts}/>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <AuctionDetails auction={auction} onSettle={handleSettle} />
      <AuctionStatus auction={auction} />
     { new Date() < new Date(auction.endTime)&&<BidInput isDisabled={(auction.seller.walletAddress === address)||auction.settled || new Date() >= new Date(auction.endTime)} onPlaceBid={handlePlaceBid} minBid={auction.highestBid || auction.minBid} />}
      <BidHistory bids={bids} />
    </div>
  );
}
