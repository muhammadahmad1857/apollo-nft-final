"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getActiveAuctions } from "@/actions/auction";
import AuctionFilters from "@/components/auction/AuctionFilters";
import AuctionGrid from "@/components/auction/AuctionGrid";
import { AuctionModel,  NFTModel, UserModel } from "@/generated/prisma/models";

export default function AuctionsPage() {
  const searchParams = useSearchParams();
  const [auctions, setAuctions] = useState<(AuctionModel & {
      seller: UserModel;
      nft: NFTModel;
      highestBidder: UserModel | null;
    })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      const data = await getActiveAuctions({
        search: searchParams.get("q") || undefined,
        minPrice: searchParams.get("min") ? Number(searchParams.get("min")) : undefined,
        maxPrice: searchParams.get("max") ? Number(searchParams.get("max")) : undefined,
        endingSoon: searchParams.get("endingSoon") === "true",
      });
      setAuctions(data);
      setLoading(false);
    };

    fetchAuctions();
  }, [searchParams]); // re-run whenever URL changes

  return (
    <div className="w-screen max-w-5xl mx-auto pt-28 pb-20 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Auctions</h1>
        <p className="text-muted-foreground">Browse all active NFT auctions</p>
      </div>

      <AuctionFilters />

      {loading ? (
        <p>Loading auctions...</p>
      ) : (
        <AuctionGrid auctions={auctions} />
      )}
    </div>
  );
}
