"use client";

import { useState, useEffect } from "react";
import { AuctionModel, NFTModel, UserModel } from "@/generated/prisma/models";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "@/components/ui/button";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";

import { UniversalMediaIcon } from "../ui/UniversalMediaIcon";


export function AuctionDetails({
  auction,
  onSettle,
}: {
  auction: AuctionModel & { nft: NFTModel; seller: UserModel };
  onSettle: () => Promise<void> | void;
}) {
  const ended = new Date() >= new Date(auction.endTime);
  const highestBid = auction.highestBid || auction.minBid;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Local state for settle button
  const [settleLoading, setSettleLoading] = useState(false);
  const [settledLocally, setSettledLocally] = useState(false);

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
          <UniversalMediaIcon
            tokenUri={auction.nft.tokenUri || ""}
            uri={auction.nft.mediaUrl||""}
            className="w-full h-full object-cover"
          />
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
          <Link href={`/artist/${auction.seller.walletAddress}`} className="mt-4 flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
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
              Seller:{" "}
              <span className="font-medium hover:underline">
                {auction.seller.name || auction.seller.walletAddress}
              </span>
            </div>
          </Link>

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
                  <div
                    className="rounded-xl px-4 py-2 
bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
shadow-[0_10px_25px_rgba(0,0,0,0.15)] 
dark:shadow-[0_0_25px_rgba(255,255,255,0.08)]
border border-zinc-200/60 dark:border-zinc-700/60
hover:shadow-[0_15px_35px_rgba(0,0,0,0.25)]
dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.15)]
transition-all duration-300"
                  >
                    <div className="text-2xl font-bold font-mono">
                      {timeLeft?.days ?? 0}
                    </div>
                    <div className="text-xs tracking-wider">Days</div>
                  </div>
                  <div
                    className="rounded-xl px-4 py-2 
bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
shadow-[0_10px_25px_rgba(0,0,0,0.15)] 
dark:shadow-[0_0_25px_rgba(255,255,255,0.08)]
border border-zinc-200/60 dark:border-zinc-700/60
hover:shadow-[0_15px_35px_rgba(0,0,0,0.25)]
dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.15)]
transition-all duration-300"
                  >
                    <div className="text-2xl font-bold font-mono">
                      {timeLeft?.hours ?? 0}
                    </div>
                    <div className="text-xs tracking-wider">Hours</div>
                  </div>
                  <div
                    className="rounded-xl px-4 py-2 
bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
shadow-[0_10px_25px_rgba(0,0,0,0.15)] 
dark:shadow-[0_0_25px_rgba(255,255,255,0.08)]
border border-zinc-200/60 dark:border-zinc-700/60
hover:shadow-[0_15px_35px_rgba(0,0,0,0.25)]
dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.15)]
transition-all duration-300"
                  >
                    <div className="text-2xl font-bold font-mono">
                      {timeLeft?.minutes ?? 0}
                    </div>
                    <div className="text-xs tracking-wider">Minutes</div>
                  </div>
                  <div
                    className="rounded-xl px-4 py-2 
bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md
shadow-[0_10px_25px_rgba(0,0,0,0.15)] 
dark:shadow-[0_0_25px_rgba(255,255,255,0.08)]
border border-zinc-200/60 dark:border-zinc-700/60
hover:shadow-[0_15px_35px_rgba(0,0,0,0.25)]
dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.15)]
transition-all duration-300"
                  >
                    <div className="text-2xl font-bold font-mono">
                      {timeLeft?.seconds ?? 0}
                    </div>
                    <div className="text-xs tracking-wider">Seconds</div>
                  </div>
                </div>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm pt-1 font-medium">
                Auction Ends In
              </p>
            </div>
          </div>
          {/* Media Preview */}
          {auction.nft.tokenUri && (
            <div className="mt-6">
              <UniversalMediaViewer
                tokenUri={auction.nft.tokenUri}
                uri={auction.nft.mediaUrl}
                fileType={auction.nft.fileType}
                gateway={process.env.NEXT_PUBLIC_GATEWAY_URL}
                className="w-full"
                style={{ maxHeight: 384 }}
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        {ended && !auction.settled && !settledLocally && (
          <Button
            onClick={async () => {
              setSettleLoading(true);
              try {
                await onSettle();
                setSettledLocally(true);
              } finally {
                setSettleLoading(false);
              }
            }}
            variant="destructive"
            className="mt-4 w-full lg:w-48 self-start"
            disabled={settleLoading}
          >
            {settleLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Settling...
              </span>
            ) : (
              "Settle Auction"
            )}
          </Button>
        )}
      </div>

      {/* Fullscreen Video Modal removed, handled by UniversalMediaViewer */}
    </div>
  );
}
