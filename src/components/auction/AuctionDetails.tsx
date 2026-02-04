"use client";

import { useState, useEffect } from "react";
import { AuctionModel, NFTModel, UserModel } from "@/generated/prisma/models";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "@/components/ui/button";
import { Music, Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PinataJSON } from "@/types";

async function getFileType(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const contentType = res.headers.get("content-type");

    if (!contentType) return "unknown";
    if (contentType.includes("video")) return "video";
    if (contentType.includes("audio")) return "audio";
    if (contentType.includes("image")) return "image";
    return "unknown";
  } catch (err) {
    console.error("Failed to detect file type", err);
    return "unknown";
  }
}

export function AuctionDetails({
  auction,
  onSettle,
}: {
  auction: AuctionModel & { nft: NFTModel; seller: UserModel };
  onSettle: () => void;
}) {
  const ended = new Date() >= new Date(auction.endTime);
  const highestBid = auction.highestBid || auction.minBid;

  const [mediaType, setMediaType] = useState<
    "video" | "audio" | "image" | "unknown"
  >("unknown");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    const detectMedia = async () => {
      if (!auction.nft.tokenUri) return;

      try {
        const res = await fetch(
          auction.nft.tokenUri.replace(
            "ipfs://",
            `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`,
          ),
        );
        const metadata: PinataJSON = await res.json();
        const media = metadata.media;

        setMediaUrl(
          media.startsWith("ipfs://")
            ? `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${media.replace("ipfs://", "")}`
            : media,
        );

        const type = await getFileType(
          `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${media.replace("ipfs://", "")}`,
        );
        setMediaType(type as any);
      } catch (err) {
        console.error("Failed to load media from tokenUri", err);
        toast.error("Failed to load NFT media");
      }
    };

    detectMedia();
  }, [auction.nft.tokenUri]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.25 } },
  };

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
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <Music size={80} strokeWidth={1} />
          </div>
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
              Seller:{" "}
              <span className="font-medium">
                {auction.seller.name || auction.seller.walletAddress}
              </span>
            </div>
          </div>

          {/* Auction Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
              <p className="font-semibold">{auction.minBid} Apollo</p>
              <p className="text-zinc-500 dark:text-zinc-400">Minimum Bid</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
              <p className="font-semibold">{highestBid} Apollo</p>
              <p className="text-zinc-500 dark:text-zinc-400">Highest Bid</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center col-span-2">
              <p className="font-semibold">
                {new Date(auction.endTime).toLocaleString()}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">Ends At</p>
            </div>
          </div>

          {/* Media Preview */}
          {mediaType !== "unknown" && mediaUrl && (
            <div className="mt-6">
              {mediaType === "video" ? (
                <div className="relative group cursor-pointer">
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full max-h-96 rounded-xl shadow-lg object-contain"
                  />
                  <button
                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                    onClick={() => setShowFullScreen(true)}
                  >
                    <Play size={20} />
                  </button>
                </div>
              ) : mediaType === "audio" ? (
                <audio controls className="w-full mt-2">
                  <source src={mediaUrl} />
                  Your browser does not support the audio element.
                </audio>
              ) : null}
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

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {showFullScreen && mediaType === "video" && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowFullScreen(false)}
          >
            <div
              className="relative w-full h-full max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-white p-3 bg-black/50 rounded-full hover:bg-black/70 transition"
                onClick={() => setShowFullScreen(false)}
              >
                <X size={24} />
              </button>
              <video
                src={mediaUrl}
                controls
                autoPlay
                className="w-full h-full rounded-xl shadow-2xl object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
