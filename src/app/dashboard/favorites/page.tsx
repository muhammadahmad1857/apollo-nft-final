"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";
import { useLikedNFTs } from "@/hooks/useLikedNFTs";
import NFTCard from "@/components/marketplace/nftCard";
import Loader from "@/components/loader/index";
import { Heart, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SortOption = "newest" | "oldest" | "price-low" | "price-high";
type FilterStatus = "all" | "listed" | "unlisted";
type FilterAuction = "all" | "active" | "settled";

export default function FavoritesPage() {
  const { address } = useAccount();
  const { data: user } = useUser(address || "");
  
  const { data: likedNFTsData, isLoading, isError } = useLikedNFTs(user?.id || null);
  
  const [sort, setSort] = useState<SortOption>("newest");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterAuction, setFilterAuction] = useState<FilterAuction>("all");
  const [search, setSearch] = useState("");

  // Fun facts to display while loading
  const funFacts = [
    "Did you know? The first NFT ever minted was on May 3, 2014 by Kevin McCoy!",
    "Fun fact: NFTs use blockchain technology to prove digital ownership and authenticity.",
    "Interesting: Some NFTs have sold for millions of dollars at auctions!",
    "Did you know? Each NFT has a unique digital signature that cannot be forged.",
    "Fun fact: You can like multiple NFTs to keep track of your favorite creations!",
    "Interesting: NFTs can represent art, music, collectibles, virtual real estate, and more!",
    "Did you know? Smart contracts power the auction and trading features of NFTs.",
    "Fun fact: Your liked NFTs are permanently stored and can be accessed anytime!",
  ];

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    if (!likedNFTsData) return [];

    const filtered = likedNFTsData
      .filter((like) => {
        const nft = like.nft;
        if (!nft) return false;

        // Search filter
        if (search && !nft.title.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }

        // Status filter
        if (filterStatus === "listed" && !nft.isListed) return false;
        if (filterStatus === "unlisted" && nft.isListed) return false;

        // Auction filter
        if (filterAuction === "active") {
          if (!nft.auction) return false;
          const now = new Date();
          const startTime = new Date(nft.auction.startTime);
          const endTime = new Date(nft.auction.endTime);
          if (!(startTime <= now && endTime >= now && !nft.auction.settled)) return false;
        }
        if (filterAuction === "settled") {
          if (!nft.auction?.settled) return false;
        }

        return true;
      });

    // Sort
    filtered.sort((a, b) => {
      const nftA = a.nft;
      const nftB = b.nft;
      if (!nftA || !nftB) return 0;

      switch (sort) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price-low":
          return (nftA.mintPrice || 0) - (nftB.mintPrice || 0);
        case "price-high":
          return (nftB.mintPrice || 0) - (nftA.mintPrice || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [likedNFTsData, sort, filterStatus, filterAuction, search]);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Heart className="w-16 h-16 text-zinc-200" />
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <p className="text-zinc-200">Please connect your wallet to view your favorites</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Heart className="w-16 h-16 text-red-400" />
        <h1 className="text-2xl font-bold">Error Loading Favorites</h1>
        <p className="text-zinc-200">Something went wrong. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Heart className="w-8 h-8 fill-red-500 text-red-500" />
          <h1 className="text-3xl font-bold">My Favorites</h1>
        </div>
        <p className="text-zinc-200">
          {likedNFTsData?.length || 0} NFT{likedNFTsData?.length !== 1 ? "s" : ""} liked
        </p>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4 bg-card rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
          <Input
            placeholder="Search by title or creator..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NFTs</SelectItem>
                <SelectItem value="listed">Listed Only</SelectItem>
                <SelectItem value="unlisted">Unlisted Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auction Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Auction</label>
            <Select value={filterAuction} onValueChange={(value) => setFilterAuction(value as FilterAuction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Auctions</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="settled">Settled Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Liked</SelectItem>
                <SelectItem value="oldest">Oldest Liked</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader text="Fetching your favorites..." facts={funFacts} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedNFTs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Heart className="w-16 h-16 text-red-400" />
          <h2 className="text-xl font-semibold">No Favorites Yet</h2>
          <p className="text-zinc-200 text-center max-w-md">
            {search
              ? "No NFTs match your search. Try adjusting your filters or search terms."
              : "Start exploring and like your favorite NFTs to see them here!"}
          </p>
        </div>
      )}

      {/* NFT Grid */}
      {!isLoading && filteredAndSortedNFTs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedNFTs.map((like) => {
            const nft = like.nft;
            const likes = like.nft.likes || [];
            if (!nft) return null;

            // Check if current user owns this NFT
            const isOwned = user?.id === nft.ownerId;
            const hasAuction = nft.auction && !nft.auction.settled;
            const isAuctionActive =
              hasAuction &&
              new Date(nft.auction!.startTime) <= new Date() &&
              new Date(nft.auction!.endTime) >= new Date();

            return (
              <div key={nft.id} className="relative">
                {/* Owned Badge */}
                {isOwned && (
                  <div className="absolute top-2 right-2 z-20 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ✓ Owned
                  </div>
                )}

                <NFTCard
                  title={nft.title}
                  description={nft.description}
                  name={nft.creator?.name || "Unknown"}
                  cover={nft.imageUrl}
                  media={nft.mediaUrl}
                  minted={true}
                  tokenId={nft.tokenId}
                  mintPrice={nft.mintPrice}
                  showBuyButton={!isOwned && nft.isListed}
                  showEditRoyaltyButton={isOwned && nft.isListed}
                  token={nft.tokenUri}
                  nftId={nft.id}
                  ownerAddress={nft.owner?.walletAddress || ""}
                  auctionApproved={nft.approvedAuction}
                  fileType={nft.fileType}
                  userId={user?.id}
                  address={address || ""}
                  likes={likes}
                  auction={
                    nft.auction
                      ? {
                          id: nft.auction.id,
                          startTime: nft.auction.startTime.toISOString(),
                          endTime: nft.auction.endTime.toISOString(),
                          settled: nft.auction.settled,
                          highestBid: nft.auction.highestBid || 0,
                          minBid: nft.auction.minBid,
                        }
                      : null
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
