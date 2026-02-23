"use client";

import { useEffect, useState } from "react";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";
import { motion } from "framer-motion";
import Image from "next/image";
import { Share } from "lucide-react";
import LikeButton from "./nftLikes";
import ShareModal from "./ShareModel";
import { useBuyNFT } from "@/hooks/useMarketplace";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { transferOwnership } from "@/actions/nft";
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
import { UniversalMediaIcon } from "../ui/UniversalMediaIcon";
import { NFTLikeModel } from "@/generated/prisma/models";

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
  token:string;
  nftId: number;
  ownerAddress:string;
  auctionApproved:boolean;
  likes:NFTLikeModel[]
  fileType?: string;
  userId?:number
  address:string
  onCardClick?: () => void;
  auction: {
    id: number;
    startTime: string;
    endTime: string;
    settled: boolean;
    highestBid?: number;
    minBid:number
  } | null;
}

const NFTCard = ({
  title,
  cover,
  ownerAddress,
  token,
  tokenId,
  name,
  description,
  mintPrice,
  likes,
  showBuyButton,
  showEditRoyaltyButton,
  auction,
  nftId,
  media,
  auctionApproved,
  fileType,
  userId,
  address,
  onCardClick
}: NFTCardProps) => {
  const { buyNFT, isPending } = useBuyNFT();
  const router = useRouter();
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  const [showShareModal,setShowShareModal] = useState(false)
  const [playlists, setPlaylists] = useState<{ id: number; name: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
 
  const now = new Date();
  const isOwner = !!address && address === ownerAddress;
  const isAuctionActive =
    auction &&
    !auction.settled &&
    new Date(auction.startTime) <= now &&
    new Date(auction.endTime) >= now;

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isOwner || !address) return;

      try {
        const response = await fetch(`/api/playlists?walletAddress=${address}`);
        const json = await response.json();
        const data = Array.isArray(json?.playlists) ? json.playlists : [];
        setPlaylists(data);
        setSelectedPlaylistId(data[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to fetch playlists", error);
      }
    };

    void fetchPlaylists();
  }, [address, isOwner]);

  console.log("nft.media", cover);
  console.log("NFT title received:", auction);

  const handleBuy = async () => {
    if (!mintPrice) return toast.error("Mint price not available");

    try {
      await buyNFT(BigInt(tokenId), parseEther(String(mintPrice))); // use real price
      console.log("User ID", userId);
      if (userId) {
        await transferOwnership(tokenId, userId); // update DB
      }
      else{
        toast.error("User not found. Please connect wallet and try again.");
        return;
      }
      toast.success("NFT purchased successfully!");
      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("error in buying", e);
      toast.error(e?.message || "Failed to purchase NFT.");
    }
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
      return;
    }

    if (isAuctionActive) {
      router.push(`/auction/${nftId}`);
    } else {
      router.push(`/marketplace/${tokenId}`);
    }
  };

  const handleAddToPlaylist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!address || !selectedPlaylistId) {
      toast.error("Select a playlist first");
      return;
    }

    setIsAddingToPlaylist(true);
    try {
      const response = await fetch(`/api/playlists/${selectedPlaylistId}/items?walletAddress=${address}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId }),
      });

      const json = await response.json();
      if (!response.ok) {
        toast.error(json?.error || "Failed to add to playlist");
        return;
      }

      toast.success("Added to playlist");
    } catch (error) {
      console.error("Failed to add to playlist", error);
      toast.error("Failed to add to playlist");
    } finally {
      setIsAddingToPlaylist(false);
    }
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
        className="group cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-background shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        onClick={handleCardClick}
      >
        {/* Status badge */}
        {isAuctionActive && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold z-10">
            Auction Live
          </div>
        )}

        {/* Main Media Preview - Large */}
        <div className="relative w-full">
          {media || token ? (
            <UniversalMediaViewer
              tokenUri={token}
              uri={media}
              fileType={fileType}
              gateway={process.env.NEXT_PUBLIC_GATEWAY_URL}
              className="w-full"
              style={{ height: 320 }}
            />
          ) : null}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3">
          {/* Title, Cover Image, and Info */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 flex items-center gap-3">
              {cover && (
                <Image
                  src={cover}
                  alt={title}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform duration-700"
                />
              )}
              {!cover && token && (
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                  <UniversalMediaIcon
                    tokenUri={token}
                    uri={media}
                    fileType={fileType}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base truncate" title={title}>
                  {title}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  By{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {name}
                  </span>{" "}
                  • #{tokenId}
                </p>
              </div>
            </div>
          </div>

          {/* Price */}
          {(mintPrice || auctionApproved) && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Price:{" "}
              <span className="font-semibold">
                {(
                  !auctionApproved
                    ? mintPrice?.toFixed(4)
                    : auction?.highestBid != null && auction.highestBid > 0
                      ? auction.highestBid.toFixed(4)
                      : auction?.minBid != null && auction.minBid > 0
                        ? auction.minBid.toFixed(4)
                        : mintPrice?.toFixed(4)
                )} APOLLO
              </span>
            </p>
          )}

          {/* Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {description || "No description provided"}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <LikeButton userId={userId||0} nftId={nftId} likes={likes} />
              {isOwner && (
                <>
                  <select
                    value={selectedPlaylistId ?? ""}
                    onChange={(e) => setSelectedPlaylistId(Number(e.target.value))}
                    className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs"
                  >
                    {playlists.length === 0 ? (
                      <option value="">No playlists</option>
                    ) : (
                      playlists.map((playlist) => (
                        <option key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    onClick={handleAddToPlaylist}
                    disabled={isAddingToPlaylist || playlists.length === 0}
                    className="px-2 py-1 rounded-md border border-zinc-700 text-xs hover:border-zinc-500 disabled:opacity-50"
                  >
                    {isAddingToPlaylist ? "Adding..." : "Add to Playlist"}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareModal(true);
              }}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-500 transition-colors"
              aria-label="Share"
            >
              <Share size={18} />
              <span className="text-sm font-medium">Share</span>
            </button>
            {!address ? (
              <p className="ml-auto text-sm text-foreground">Connect wallet</p>
            ) : isAuctionActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/auction/${nftId}`);
                }}
                className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                View Auction
              </button>
            ) : showBuyButton && mintPrice ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBuyConfirm(true);
                }}
                className="ml-auto px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:pointer-events-none"
                disabled={isPending || !address || address === ownerAddress}
              >
                {address === ownerAddress ? "My NFT" : isPending ? "Buying..." : "Buy"}
              </button>
            ) : null}

            {showEditRoyaltyButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/list-marketplace/${tokenId}/`);
                }}
                className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Edit Listing
              </button>
            )}
          </div>
        </div>
      </motion.div>

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
              <strong>{mintPrice?.toFixed(4)} APOLLO</strong> for this NFT.
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
              onClick={(e) => {
                e.stopPropagation();
                setShowBuyConfirm(false);
              }}
              disabled={isProcessingBuy}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={async (e) => {
                e.stopPropagation();
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
