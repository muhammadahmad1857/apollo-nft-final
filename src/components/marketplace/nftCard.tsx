"use client";

import { useState, useEffect } from "react";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Music, Play, Share, X } from "lucide-react";
import LikeButton from "./nftLikes";
import ShareModal from "./ShareModel";
import { useBuyNFT } from "@/hooks/useMarketplace";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { transferOwnership } from "@/actions/nft";
import { getFileTypeByIPFS } from "@/actions/files";
import { parseEther } from "viem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface NFTCardProps {
  title: string;
  description: string;
  name: string;
  cover?: string;
  media: string;
  minted: boolean;
  tokenId: number;
  mintPrice?: number; // in wei
  showBuyButton?: boolean;
  showEditRoyaltyButton?: boolean;
  nftId: number;
  ownerAddress:string;
  auction?: {
    id: number;
    startTime: string;
    endTime: string;
    settled: boolean;
    highestBid?: number;
  };
}

async function detectFileTypeFromHEAD(url: string): Promise<string> {
  try {
    const gatewayUrl = url.startsWith("ipfs://")
      ? `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${url.replace(
          "ipfs://",
          "",
        )}`
      : url;

    const res = await fetch(gatewayUrl, { method: "HEAD" });
    const contentType = res.headers.get("content-type");

    if (!contentType) return "unknown";

    if (contentType.includes("video")) return ".mp4";
    if (contentType.includes("audio")) {
      if (contentType.includes("wav")) return ".wav";
      if (contentType.includes("mpeg")) return ".mp3";
      return ".audio";
    }
    if (contentType.includes("image")) return ".image";

    return "unknown";
  } catch (err) {
    console.error("HEAD type detection failed", err);
    return "unknown";
  }
}

const NFTCard = ({
  title,
  cover,
  ownerAddress,
  media,
  tokenId,
  name,
  description,
  mintPrice,
  showBuyButton,
  showEditRoyaltyButton,
  auction,
  nftId,
}: NFTCardProps) => {
  const { buyNFT, isPending } = useBuyNFT();
  const router = useRouter();
  const { address } = useAccount();
  const { data: user } = useUser(address);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  const [showShareModal,setShowShareModal] = useState(false)
  const now = new Date();
  const isAuctionActive =
    auction &&
    !auction.settled &&
    new Date(auction.startTime) <= now &&
    new Date(auction.endTime) >= now;

  console.log("nft.media", cover);

  const handleBuy = async () => {
    if (!mintPrice) return toast.error("Mint price not available");

    try {
      await buyNFT(BigInt(tokenId), parseEther(String(mintPrice))); // use real price
      if (user?.id) {
        await transferOwnership(tokenId, user.id); // update DB
      }
      toast.success("NFT purchased successfully!");
      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("error in buying", e);
      toast.error(e?.message || "Failed to purchase NFT.");
    }
  };

  const handleEditRoyalty = () => {
    router.push(`/dashboard/token/${tokenId}/edit`);
  };

  // Remove old mediaType, showVideoModal, showShareModal, realMedia, and useEffects

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.25 } },
  };

  return (
    <>
      <motion.div
        className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Status badge */}

        {isAuctionActive && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Auction Live
          </div>
        )}

        {/* Media preview (cover image) */}
        <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          {cover ? (
            <Image
              src={cover}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
              <Music size={80} strokeWidth={1} />
            </div>
          )}
        </div>
        

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-lg mb-1.5 truncate">{title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-1 min-h-12">
            {description || "No description provided"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            By{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {name}
            </span>{" "}
            • #{tokenId}
          </p>
          {mintPrice && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              Price:{" "}
              <span className="font-semibold">
                {mintPrice.toFixed(4)} Apollo
              </span>
            </p>
          )}

          {/* Media Preview (not cover) */}
        {media && (
          <div className="px-4 py-2">
            <UniversalMediaViewer
              uri={media}
              type={""} // If you have the type, pass it here, else UniversalMediaViewer will infer
              gateway={process.env.NEXT_PUBLIC_GATEWAY_URL}
              className="w-full"
              style={{ maxHeight: 192 }}
            />
          </div>
        )}
          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <LikeButton userId={user?.id || 0} tokenId={tokenId} />
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-500 transition-colors"
              aria-label="Share"
            >
              <Share size={18} />
              <span className="text-sm font-medium">Share</span>
            </button>
            {/* {showBuyButton && mintPrice && (
              <button
                onClick={() => setShowBuyConfirm(true)}
                className="ml-auto px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                disabled={isPending}
              >
                {isPending ? "Buying..." : "Buy"}
              </button>
            )} */}
            {isAuctionActive ? (
              <button
                onClick={() => router.push(`/auction/${nftId}`)}
                className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                View Auction
              </button>
            ) : (
              showBuyButton &&
              mintPrice && (
                <button
                  onClick={() => setShowBuyConfirm(true)}
                  className="ml-auto px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:pointer-events-none"
                  disabled={isPending || address === ownerAddress}
                >
                  {address === ownerAddress ? isPending ? "Buying..." : "Buy":"Sold"}
                </button>
              )
            )}

            {showEditRoyaltyButton && (
              <button
                onClick={handleEditRoyalty}
                className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Edit Listing
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Video modal removed, handled by UniversalMediaViewer */}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tokenId={tokenId}
        title={title}
        name={name}
      />
      <Dialog open={showBuyConfirm} onOpenChange={setShowBuyConfirm}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to pay{" "}
              <strong>{mintPrice?.toFixed(4)} Apollo</strong> for this NFT.
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 text-center">
            <p className="text-xs text-zinc-500">
              Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowBuyConfirm(false)}
              disabled={isProcessingBuy}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                try {
                  setIsProcessingBuy(true);
                  await handleBuy();
                  setShowBuyConfirm(false);
                } finally {
                  setIsProcessingBuy(false);
                }
              }}
              disabled={isProcessingBuy}
            >
              {isProcessingBuy ? "Processing..." : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NFTCard;
