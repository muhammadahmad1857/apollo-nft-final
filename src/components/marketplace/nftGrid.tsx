"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(mints.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedMints = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return mints.slice(start, start + PAGE_SIZE);
  }, [mints, currentPage]);

  const pageStart = mints.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, mints.length);

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [currentPage, totalPages]);

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
        <Button className="mt-4" onClick={()=>loadMints()}>
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
        <Button  className="mt-4" onClick={()=>loadMints()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Recent Public Mints ({mints.length})</h2>
        <Button  onClick={()=>loadMints()}>
          Refresh
        </Button>
      </div>

      <div className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
        Showing {pageStart}-{pageEnd} of {mints.length}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {pagedMints.map((nft) => (
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

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>

          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
