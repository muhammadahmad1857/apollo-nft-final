"use client";

import { Button } from "@/components/ui/button";
import { AuctionModel, NFTModel, UserModel } from "@/generated/prisma/models";

export function AuctionDetails({ auction, onSettle }: { auction: AuctionModel &{nft:NFTModel,seller:UserModel}; onSettle: () => void }) {
  const ended = new Date() >= new Date(auction.endTime);
  const highestBid = auction.highestBid || auction.minBid;

  return (
    <div className="p-6 bg-white shadow rounded space-y-4">
      <h1 className="text-2xl font-bold">{auction.nft.name}</h1>
      <p>{auction.nft.description}</p>
      <div className="flex justify-between items-center">
        <div>
          <p>Seller: {auction.seller.name || auction.seller.walletAddress}</p>
          <p>Minimum Bid: {auction.minBid} ETH</p>
          <p>Highest Bid: {highestBid} ETH</p>
          <p>Ends: {new Date(auction.endTime).toLocaleString()}</p>
        </div>
        {ended && !auction.settled && (
          <Button onClick={onSettle} variant="destructive">
            Settle Auction
          </Button>
        )}
      </div>
    </div>
  );
}
