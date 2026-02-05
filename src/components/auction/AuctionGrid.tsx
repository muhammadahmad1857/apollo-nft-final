import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Music } from "lucide-react";
import { AuctionModel, NFTModel, UserModel } from "@/generated/prisma/models";
import { UniversalMediaIcon } from "../ui/UniversalMediaIcon";

export default function AuctionGrid({
  auctions,
}: {
  auctions: (AuctionModel & {
    seller: UserModel;
    highestBidder: UserModel | null;
    nft: NFTModel;
  })[];
}) {
  if (!auctions.length) {
    return (
      <p className="text-muted-foreground text-center py-10">
        No active auctions found. Try removing filters
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map((auction) => {
        const currentBid = auction.highestBid ?? auction.minBid;

        return (
          <Link
            key={auction.id}
            href={`/auction/${auction.nft.id}`}
            className="group"
          >
            <Card className="hover:shadow-lg transition cursor-pointer h-full flex flex-col">
              <CardHeader className="p-0 min-h-36 relative">
                {auction.nft.imageUrl ? (
                  <Image
                    src={auction.nft.imageUrl.replace(
                      "ipfs://",
                      `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`,
                    )}
                    alt={auction.nft.title}
                    className="min-h-36 w-full object-cover rounded-t-lg"
                    fill
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                   <UniversalMediaIcon tokenUri={auction.nft.tokenUri || ""} className="w-16 h-16" />
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4 space-y-2 flex-1">
                <h3 className="text-lg font-semibold">{auction.nft.title}</h3>

                <p className="text-sm text-muted-foreground">
                  Seller: {auction.seller.name}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-medium">{currentBid} APOLLO</span>
                  <Badge variant="secondary">Live</Badge>
                </div>
              </CardContent>

              <CardFooter className="px-4 pb-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Ends at {new Date(auction.endTime).toLocaleString()}
                </span>

                {/* View Auction Button */}
                <Button
                  size="sm"
                  className="pointer-events-none group-hover:bg-primary group-hover:text-primary-foreground transition"
                >
                  View Auction
                </Button>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
