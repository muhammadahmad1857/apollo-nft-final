"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";
import { Clock, Heart } from "lucide-react";

interface NFT {
  id: number;
  tokenId: number;
  name: string | null;
  title: string | null;
  imageUrl: string | null;
  mediaUrl: string | null;
  mintPrice: number | null;
  isListed: boolean;
  fileType: string | null;
  likes: { id: number }[];
  auction: {
    id: number;
    highestBid: number | null;
    minBid: number;
    endTime: Date;
    settled: boolean;
  } | null;
}

interface ArtistNFTGridProps {
  nfts: NFT[];
}

export function ArtistNFTGrid({ nfts }: ArtistNFTGridProps) {
  if (nfts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-6xl">🎨</div>
          <h3 className="text-2xl font-semibold">No Active Listings</h3>
          <p className="text-muted-foreground">
            This artist doesn&apos;t have any NFTs currently listed on the marketplace or in auction.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
      {nfts.map((nft) => {
        const isInAuction = nft.auction && !nft.auction.settled;
        const linkHref = isInAuction ? `/auction/${nft.tokenId}` : `/marketplace/${nft.tokenId}`;
        const price = isInAuction && nft.auction
          ? (nft.auction.highestBid ? nft.auction.highestBid : nft.auction.minBid)
          : nft.mintPrice;

        return (
          <Link key={nft.id} href={linkHref}>
            <Card className="group relative overflow-hidden rounded-2xl bg-background/80 backdrop-blur-sm border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardContent className="p-0">
                {/* Media */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <UniversalMediaViewer
                    uri={nft.mediaUrl || nft.imageUrl || "/placeholder.svg"}
                    fileType={nft.fileType || "image"}
                    className="object-cover w-full h-full group-hover:scale-[1.04] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {isInAuction ? (
                      <Badge className="bg-white/85 text-foreground border border-white/40 backdrop-blur-sm shadow-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        Auction
                      </Badge>
                    ) : (
                      <Badge className="bg-white/85 text-foreground border border-white/40 backdrop-blur-sm shadow-sm">
                        Listed
                      </Badge>
                    )}
                  </div>

                  {/* Likes */}
                  {nft.likes.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/85 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/40 shadow-sm">
                      <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                      <span className="text-xs font-medium">{nft.likes.length}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-5 pt-4 pb-5 space-y-3">
                  <h3 className="text-lg font-semibold leading-snug line-clamp-2">
                    {nft.title || nft.name || `NFT #${nft.tokenId}`}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {isInAuction ? "Current Bid" : "Price"}
                    </span>
                    <span className="text-lg font-semibold">
                      {price ? `${price} APOLLO` : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function ArtistNFTGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-background/80">
          <CardContent className="p-0">
            <Skeleton className="aspect-square w-full" />
            <div className="px-5 pt-4 pb-5 space-y-3">
              <Skeleton className="h-6 w-4/5" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
