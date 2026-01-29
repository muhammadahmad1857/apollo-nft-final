"use client";
import { Play, X, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "wagmi";
import ShareModal from "./ShareModel";
import LikeButton from "./nftLikes";
import { toggleNFTLike, checkIfUserLikedNFT, getNFTLikesByNFT } from "@/actions/nft-likes";

interface NFTInteractiveContentProps {
  tokenId: number;
  media: string;
  title: string;
  name: string;
}

export default function NFTInteractiveContent({ tokenId, media, title, name }: NFTInteractiveContentProps) {
  const { address } = useAccount();
  const { data: user, isLoading: loadingUser } = useUser(address);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loadingLike, setLoadingLike] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [mediaType, setMediaType] = useState<"audio" | "video" | "unknown">("unknown");

  // Load initial like state and count
  useEffect(() => {
    let mounted = true;

    const loadLikes = async () => {
      const likes = await getNFTLikesByNFT(tokenId);
      if (!mounted) return;
      setLikeCount(likes.length);

      if (user?.id) {
        const hasLiked = await checkIfUserLikedNFT(tokenId, user.id);
        if (!mounted) return;
        setLiked(hasLiked);
      }
    };

    loadLikes();

    return () => {
      mounted = false;
    };
  }, [tokenId, user?.id]);

  // Detect media type
  useEffect(() => {
    const detectMediaType = async (url: string) => {
      if (!url) return;
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) throw new Error("HEAD request failed");
        const contentType = response.headers.get("content-type")?.toLowerCase() || "";
        if (contentType.startsWith("audio/")) setMediaType("audio");
        else if (contentType.startsWith("video/")) setMediaType("video");
      } catch (err) {
        console.warn("Media type detection failed:", err);
      }
    };
    detectMediaType(media);
  }, [media]);

  // Handle like toggle
  const handleLike = async () => {
    if (!user?.id) {
      toast.error("Connect wallet to like NFTs");
      return;
    }
    if (loadingLike) return;

    setLoadingLike(true);
    try {
      const { liked: newLiked } = await toggleNFTLike(tokenId, user.id);
      setLiked(newLiked);
      setLikeCount((c) => (newLiked ? c + 1 : c - 1));
      toast.success(newLiked ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update like");
    } finally {
      setLoadingLike(false);
    }
  };

  return (
    <>
      {/* Media Controls */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center sm:justify-start">
        {mediaType === "audio" && media && (
          <audio controls className="w-full max-w-md" controlsList="nodownload">
            <source src={media} type="audio/mpeg" />
          </audio>
        )}

        {mediaType === "video" && media && (
          <button
            onClick={() => setShowVideo(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-lg transition-all"
          >
            <Play size={20} fill="currentColor" />
            Play Video
          </button>
        )}

        <button
          onClick={handleLike}
          disabled={loadingLike}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
            liked
              ? "bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/30"
              : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-600"
          }`}
        >
          <LikeButton userId={user?.id||0} tokenId={tokenId} showText={true} />
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-500 transition-colors"
          aria-label="Share"
        >
          <Share size={18} />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Fullscreen Video Modal */}
      {showVideo && media && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative w-full max-w-6xl mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white bg-black/60 hover:bg-black/80 rounded-full p-3 transition-colors"
            >
              <X size={28} />
            </button>
            <video controls autoPlay className="w-full rounded-xl shadow-2xl" src={media} />
          </div>
        </div>
      )}

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} tokenId={tokenId} title={title} name={name} />
    </>
  );
}
