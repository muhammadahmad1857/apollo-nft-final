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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nfts.map((nft) => {
        const isInAuction = nft.auction && !nft.auction.settled;
        const linkHref = isInAuction ? `/auction/${nft.tokenId}` : `/marketplace/${nft.tokenId}`;
        const price = isInAuction && nft.auction
          ? (nft.auction.highestBid ? nft.auction.highestBid : nft.auction.minBid)
          : nft.mintPrice;

        return (
          <Link key={nft.id} href={linkHref}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border">
              <CardContent className="p-0">
                {/* Media */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <UniversalMediaViewer
                    uri={nft.mediaUrl || nft.imageUrl || "/placeholder.svg"}
                    fileType={nft.fileType || "image"}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {isInAuction ? (
                      <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Auction
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Listed
                      </Badge>
                    )}
                  </div>

                  {/* Likes */}
                  {nft.likes.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                      <span className="text-xs font-medium">{nft.likes.length}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold truncate">
                    {nft.title || nft.name || `NFT #${nft.tokenId}`}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {isInAuction ? "Current Bid" : "Price"}
                    </span>
                    <span className="font-bold">
                      {price ? `${price} ETH` : "N/A"}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="overflow-hidden border-border">
          <CardContent className="p-0">
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
