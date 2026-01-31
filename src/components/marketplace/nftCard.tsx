"use client";


import { useState, useEffect } from "react";
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

export interface NFTCardProps {
  title: string;
  description: string;
  name: string;
  cover?: string;
  media: string;
  minted: boolean;
  tokenId: number;
  showBuyButton?: boolean;
  showEditRoyaltyButton?: boolean;
}

const NFTCard = ({ title, cover, media, tokenId, name, description, showBuyButton, showEditRoyaltyButton }: NFTCardProps) => {
  const { buyNFT, isPending } = useBuyNFT();
  const router = useRouter();
  const { address } = useAccount();
  const { data: user } = useUser(address);
  console.log("cover",cover)
  const handleBuy = async () => {
    try {
      // For demo, price is not passed. In real use, pass correct price.
      await buyNFT(BigInt(tokenId), BigInt(0));
      toast.success("NFT purchased successfully!");
      router.refresh();
    } catch (e) {
      // Handle error
      console.error("error in buying",e)
        toast.error("Failed to purchase NFT.");
    }
  };

  const handleEditRoyalty = () => {
    router.push(`/dashboard/token/${tokenId}/edit`);
  };
  const [mediaType, setMediaType] = useState<"audio" | "video" | "unknown">("unknown");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Media type detection
  useEffect(() => {
    if (!media) return;

    const detect = async () => {
      try {
        const res = await fetch(media, { method: "HEAD" });
        if (!res.ok) throw new Error();

        const type = res.headers.get("content-type")?.toLowerCase() ?? "";
        if (type.startsWith("audio/")) return "audio";
        if (type.startsWith("video/")) return "video";

        const ext = media.split(".").pop()?.toLowerCase();
        if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext ?? "")) return "audio";
        if (["mp4", "webm", "ogg", "mov"].includes(ext ?? "")) return "video";

        return "unknown";
      } catch {
        const ext = media.split(".").pop()?.toLowerCase();
        if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext ?? "")) return "audio";
        if (["mp4", "webm", "ogg", "mov"].includes(ext ?? "")) return "video";
        return "unknown";
      }
    };

    detect().then(setMediaType);
  }, [media]);

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
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-white/70 dark:bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/30 dark:border-zinc-700/50">
          <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
          Minted
        </div>

        {/* Media preview */}
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3 min-h-[3rem]">
            {description || "No description provided"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
            By <span className="font-medium text-zinc-700 dark:text-zinc-300">{name}</span> • #{tokenId}
          </p>

          {/* Media player / play button */}
          {media && mediaType !== "unknown" ? (
            mediaType === "audio" ? (
              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3 mb-4">
                <audio controls className="w-full h-9" controlsList="nodownload">
                  <source src={media} type="audio/mpeg" />
                </audio>
              </div>
            ) : (
              <button
                onClick={() => setShowVideoModal(true)}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all mb-4 shadow-sm hover:shadow-md"
              >
                <Play size={18} fill="white" />
                Play Video
              </button>
            )
          ) : (
            <p className="text-xs text-center text-zinc-500 italic mb-4">No playable media</p>
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
            {showBuyButton && (
              <button
                onClick={handleBuy}
                className="ml-auto px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                disabled={isPending}
              >
                {isPending ? "Buying..." : "Buy"}
              </button>
            )}
            {showEditRoyaltyButton && (
              <button
                onClick={handleEditRoyalty}
                className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Edit Royalty
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && mediaType === "video" && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowVideoModal(false)}
          >
            <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute -top-12 right-0 text-white p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={() => setShowVideoModal(false)}
              >
                <X size={24} />
              </button>
              <video controls autoPlay className="w-full rounded-xl shadow-2xl" src={media} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        tokenId={tokenId}
        title={title}
        name={name}
      />
    </>
  );
};

export default NFTCard;