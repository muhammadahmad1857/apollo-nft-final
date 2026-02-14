"use client";

import { useEffect, useState } from "react";
import NFTCard from "./nftCard";
import SkeletonCards from "./SekeletonCards";
import { Button } from "../ui/button";
import { getAllNFTs } from "@/actions/nft"; // server-side Prisma function
import type { AuctionModel, NFTLikeModel, NFTModel as PrismaNFT, UserModel } from "@/generated/prisma/models";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";

const PAGE_SIZE = 12;

export default function PublicMintsGrid() {
  const [mints, setMints] = useState<(PrismaNFT & { owner: UserModel,auction:AuctionModel|null,likes:NFTLikeModel[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {address} = useAccount();
  const {data:user} = useUser(address);
  const loadMints = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllNFTs(true); // server-side fetch via Prisma

setMints(data as (PrismaNFT & { owner: UserModel,auction:AuctionModel|null,likes:NFTLikeModel[] })[]);
console.log("data",data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError("Failed to load mints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMints();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <SkeletonCards count={PAGE_SIZE} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        {error}
        <Button className="mt-4" onClick={loadMints}>
          Try Again
        </Button>
      </div>
    );
  }

  if (mints.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium">No public mints yet</h2>
        <p className="text-zinc-500 mt-2">New creations will appear here</p>
        <Button  className="mt-4" onClick={loadMints}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Recent Public Mints ({mints.length})</h2>
        <Button  onClick={loadMints}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mints.map((nft) => (
          <NFTCard
            key={nft.tokenId}
            tokenId={nft.tokenId}
            title={nft.title}
            description={nft.description}
            cover={nft.imageUrl.replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`)}
            token={nft.tokenUri}
            name={nft.name || "Unknown"}
            minted={true}
            showBuyButton={true}
            mintPrice={nft.mintPrice}
            ownerAddress={nft.owner.walletAddress}
            media={nft.mediaUrl}
            auctionApproved={nft.approvedAuction}
            fileType={nft.fileType}
            likes={nft?.likes || []}
             auction={nft.auction ? {
      id: nft.auction.id,
      startTime: nft.auction.startTime.toISOString(),
      endTime: nft.auction.endTime.toISOString(),
      settled: nft.auction.settled,
      highestBid: nft.auction.highestBid || undefined,
      minBid: nft.auction.minBid,
              
    } : null}
    nftId={nft.id}
    userId={user?.id || undefined}
    address={address || ""}
          />
        ))}
      </div>
    </div>
  );
}
