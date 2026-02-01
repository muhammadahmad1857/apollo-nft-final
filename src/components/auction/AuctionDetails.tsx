"use client";

import { Button } from "@/components/ui/button";
import { AuctionModel, NFTModel, UserModel } from "@/generated/prisma/models";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function AuctionDetails({
  auction,
  onSettle,
}: {
  auction: AuctionModel & { nft: NFTModel; seller: UserModel };
  onSettle: () => void;
}) {
  const ended = new Date() >= new Date(auction.endTime);
  const highestBid = auction.highestBid || auction.minBid;

  return (
    <div className="bg-white min-h-screen mt-20 dark:bg-zinc-900 shadow-lg rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
      
      {/* NFT Image */}
      <div className="flex-shrink-0 w-full lg:w-64 h-64 relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <Image
          src={auction.nft.imageUrl}
          alt={auction.nft.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Auction Details */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* NFT Title & Description */}
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{auction.nft.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-3">
            {auction.nft.description || "No description available."}
          </p>

          {/* Seller Info */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700">
            <Avatar className="size-24 mb-2">
            <AvatarImage src={auction.seller.avatarUrl ?? ""} alt={auction.seller.name} />
            <AvatarFallback className="rounded-lg">{auction.seller.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
            </div>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Seller: <span className="font-medium">{auction.seller.name || auction.seller.walletAddress}</span>
            </div>
          </div>

          {/* Auction Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
              <p className="font-semibold">{auction.minBid} ETH</p>
              <p className="text-zinc-500 dark:text-zinc-400">Minimum Bid</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
              <p className="font-semibold">{highestBid} ETH</p>
              <p className="text-zinc-500 dark:text-zinc-400">Highest Bid</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center col-span-2">
              <p className="font-semibold">{new Date(auction.endTime).toLocaleString()}</p>
              <p className="text-zinc-500 dark:text-zinc-400">Ends At</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {ended && !auction.settled && (
          <Button
            onClick={onSettle}
            variant="destructive"
            className="mt-4 w-full lg:w-48 self-start"
          >
            Settle Auction
          </Button>
        )}
      </div>
    </div>
  );
}
