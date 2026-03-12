"use client";

import { useCallback, useEffect, useState } from "react";
import NFTCard from "./nftCard";
import SkeletonCards from "./SekeletonCards";
import { Button } from "../ui/button";
import { marketplaceApi, subscribeMarketplaceStream } from "@/lib/marketplaceApi";
import type { AuctionModel, NFTLikeModel, NFTModel as PrismaNFT, UserModel } from "@/generated/prisma/models";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";

const PAGE_SIZE = 12;

function toIsoDateString(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export default function PublicMintsGrid() {
  const [mints, setMints] = useState<(PrismaNFT & { owner: UserModel,auction:AuctionModel|null,likes:NFTLikeModel[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {address} = useAccount();
  const {data:user} = useUser(address);
  const loadMints = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const data = await marketplaceApi.nfts.getAll(true);

setMints(data as (PrismaNFT & { owner: UserModel,auction:AuctionModel|null,likes:NFTLikeModel[] })[]);
console.log("data",data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError("Failed to load mints");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMints();
  }, [loadMints]);

  useEffect(() => {
    const unsubscribe = subscribeMarketplaceStream((evt) => {
      if (
        evt.type.startsWith("marketplace.nft.") ||
        evt.type.startsWith("marketplace.auction.") ||
        evt.type.startsWith("marketplace.bid.") ||
        evt.type.startsWith("marketplace.like.")
      ) {
        void loadMints({ silent: true });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadMints]);

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
            trailer={nft.trailer}
            trailerFileType={nft.trailerFileType}
            auctionApproved={nft.approvedAuction}
            fileType={nft.fileType}
            likes={nft?.likes || []}
                 moderationStatus={nft.moderationStatus}
             auction={nft.auction ? {
      id: nft.auction.id,
                startTime: toIsoDateString(nft.auction.startTime),
                endTime: toIsoDateString(nft.auction.endTime),
      settled: nft.auction.settled,
      highestBid: nft.auction.highestBid || undefined,
      minBid: nft.auction.minBid,
              
    } : null}
    nftId={nft.id}
    userId={user?.id || undefined}
    address={address || ""}
    userBlocked={!!user?.isBlocked}
          />
        ))}
      </div>
    </div>
  );
}
