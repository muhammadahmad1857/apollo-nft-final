import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

import type { Auction, NFT, User } from "@/generated/prisma/client";

export interface AuctionHistoryItem {
  auction: Auction & { nft: NFT; seller: User; highestBidder: User | null };
  userHighestBid: number;
  won: boolean;
  canSettle: boolean;
  nft: NFT;
  seller: User;
  highestBid: number | null;
  highestBidder: User | null;
}

export function AuctionHistoryList({ auctions, onSettle, settlingId }: {
  auctions: AuctionHistoryItem[];
  onSettle: (auctionId: number, tokenId: number) => void;
  settlingId: number | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auctions You&apos;ve Participated In</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NFT</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Your Bid</TableHead>
              <TableHead>Win Amount</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auctions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No auctions found.</TableCell>
              </TableRow>
            )}
            {auctions.map(({ auction, userHighestBid, won, canSettle, nft }) => (
              <TableRow key={auction.id} className={won ? "bg-green-50 dark:bg-green-900/20" : ""}>
                <TableCell>
                  <Link href={`/marketplace/${nft.tokenId}`} className="flex items-center gap-2">
                    <Image src={nft.imageUrl} alt={nft.name} width={48} height={48} className="rounded" />
                    <span>{nft.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  {auction.settled ? (
                    <span className="text-green-600 dark:text-green-400">Settled</span>
                  ) : new Date(auction.endTime) < new Date() ? (
                    <span className="text-orange-600 dark:text-orange-400">Ended</span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400">Active</span>
                  )}
                </TableCell>
                <TableCell>Ξ {userHighestBid}</TableCell>
                <TableCell>{won ? `Ξ ${auction.highestBid}` : "-"}</TableCell>
                <TableCell>
                  {canSettle ? (
                    <Button
                      size="sm"
                      onClick={() => onSettle(auction.id, nft.tokenId)}
                      disabled={settlingId === auction.id}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {settlingId === auction.id ? "Settling..." : "Settle"}
                    </Button>
                  ) : won && auction.settled ? (
                    <span className="text-green-600 dark:text-green-400">Won</span>
                  ) : (
                    ""
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
