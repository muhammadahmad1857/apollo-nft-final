import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AuctionGrid({ auctions }: { auctions: any[] }) {
  if (!auctions.length) {
    return (
      <p className="text-muted-foreground text-center py-10">
        No active auctions found
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map((auction) => {
        const currentBid =
          auction.highestBid ?? auction.minBid;

        return (
          <Link
            key={auction.id}
            href={`/auction/${auction.nft.tokenId}`}
          >
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader className="p-0">
                <img
                  src={auction.nft.imageUrl}
                  alt={auction.nft.title}
                  className="h-56 w-full object-cover rounded-t-lg"
                />
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">
                  {auction.nft.title}
                </h3>

                <p className="text-sm text-muted-foreground">
                  Seller: {auction.seller.name}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {currentBid} ETH
                  </span>
                  <Badge variant="secondary">Live</Badge>
                </div>
              </CardContent>

              <CardFooter className="px-4 pb-4 text-xs text-muted-foreground">
                Ends at{" "}
                {new Date(auction.endTime).toLocaleString()}
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
