"use client";

import { useState, useEffect } from "react";
import { AuctionModel, NFTModel, UserModel } from "@/generated/prisma/models";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "@/components/ui/button";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";

import { UniversalMediaIcon } from "../ui/UniversalMediaIcon";



export function AuctionDetails({
  auction,
  onSettle,
}: {
  auction: AuctionModel & { nft: NFTModel; seller: UserModel };
  onSettle: () => void;
}) {
  const ended = new Date() >= new Date(auction.endTime);
  const highestBid = auction.highestBid || auction.minBid;

  // Remove old mediaType, mediaUrl, showFullScreen, and useEffect

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.25 } },
  };

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{days:number, hours:number, minutes:number, seconds:number} | null>(null);

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const end = new Date(auction.endTime);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  return (
    <div className="bg-white mt-20 dark:bg-zinc-900 shadow-lg rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
      {/* NFT Image */}
      <div className="shrink-0 w-full lg:w-64 h-64 relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {auction.nft.imageUrl ? (
          <Image
            src={auction.nft.imageUrl.replace(
              "ipfs://",
              `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`,
            )}
            alt={auction.nft.name}
            fill
            className="object-cover"
          />
        ) : (
         <UniversalMediaIcon tokenUri={auction.nft.tokenUri || ""} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Auction Details */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {auction.nft.name}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-3">
            {auction.nft.description || "No description available."}
          </p>

          {/* Seller Info */}
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={auction.seller.avatarUrl ?? ""}
                alt={auction.seller.name}
              />
              <AvatarFallback>
                {auction.seller.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Seller: {" "}
              <span className="font-medium">
                {auction.seller.name || auction.seller.walletAddress}
              </span>
            </div>
          </div>

          {/* Auction Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
              <p className="font-semibold">{auction.minBid} APOLLO</p>
              <p className="text-zinc-500 dark:text-zinc-400">Minimum Bid</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
              <p className="font-semibold">{highestBid} APOLLO</p>
              <p className="text-zinc-500 dark:text-zinc-400">Highest Bid</p>
            </div>
            <div className="col-span-2 flex flex-col items-center justify-center">
              <div className="flex gap-2 items-center justify-center mt-2 mb-1">
                {/* Outstanding Countdown Timer Design */}
                <div className="flex gap-2 text-center">
                  <div className="rounded-lg px-3 py-2 shadow-md">
                    <div className="text-2xl font-bold font-mono">{timeLeft?.days ?? 0}</div>
                    <div className="text-xs tracking-wider">Days</div>
                  </div>
                  <div className="rounded-lg px-3 py-2 shadow-md">
                    <div className="text-2xl font-bold font-mono">{timeLeft?.hours ?? 0}</div>
                    <div className="text-xs tracking-wider">Hours</div>
                  </div>
                  <div className="rounded-lg px-3 py-2 shadow-md">
                    <div className="text-2xl font-bold font-mono">{timeLeft?.minutes ?? 0}</div>
                    <div className="text-xs tracking-wider">Minutes</div>
                  </div>
                  <div className="rounded-lg px-3 py-2 shadow-md">
                    <div className="text-2xl font-bold font-mono">{timeLeft?.seconds ?? 0}</div>
                    <div className="text-xs tracking-wider">Seconds</div>
                  </div>
                </div>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm pt-1 font-medium">Auction Ends In</p>
            </div>
          </div>
          {/* Media Preview */}
          {auction.nft.tokenUri && (
            <div className="mt-6">
              <UniversalMediaViewer
                tokenUri={auction.nft.tokenUri}
                gateway={process.env.NEXT_PUBLIC_GATEWAY_URL}
                className="w-full"
                style={{ maxHeight: 384 }}
              />
            </div>
          )}
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

      {/* Fullscreen Video Modal removed, handled by UniversalMediaViewer */}
    </div>
  );
}
