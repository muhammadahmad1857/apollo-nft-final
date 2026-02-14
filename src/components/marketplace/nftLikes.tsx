"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createNFTLike,
  deleteNFTLike,
  getNFTLikesByNFT,
  getNFTLikesByUser,
  toggleNFTLike,
} from "@/actions/nft-likes"; 
import { NFTLikeModel } from "@/generated/prisma/models";

interface LikeButtonProps {
  nftId: number;
  initialCount?: number;
  className?: string;
  showText?: boolean;
  userId: number; 
  likes:NFTLikeModel[] | undefined;
}

export default function LikeButton({
  nftId,
  initialCount = 0,
  className = "",
  showText = false,
  userId,
  likes
}: LikeButtonProps) {

  const [liked, setLiked] = useState(likes ? likes.some((like) => like.userId === userId) : false);
  const [count, setCount] = useState(likes?.length || initialCount);
  const [loading, setLoading] = useState(false);

  const classNameText = `px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${className} ${
    liked
      ? "bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/30"
      : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-600"
  }`;

  const simpleClassName = `flex items-center gap-1.5 transition-colors ${className} ${
    liked ? "text-red-500" : "text-zinc-500 hover:text-red-400"
  }`;

  useEffect(() => {
    let mounted = true;
if (likes) return; // If likes are already provided, skip fetching
    (async () => {
      try {
        const likesFunc = await getNFTLikesByNFT(nftId);
        if (mounted) setCount(likesFunc.length);

        if (userId) {
          const userLikes = await getNFTLikesByUser(userId);
          const hasLiked = userLikes.some((like) => like.nftId === nftId);
          if (mounted) setLiked(hasLiked);
        }
      } catch (err) {
        console.error("Failed to fetch likes:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [nftId, userId]);

  const handleToggle = async () => {
    if (!userId) {
      toast.error("Please log in to like NFTs");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
   const result = await toggleNFTLike(nftId, userId);
setLiked(result.liked);
setCount(result.count);

    } catch (err) {
      console.error("Like toggle failed:", err);
      toast.error("Failed to update like");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={showText ? classNameText : simpleClassName}
      aria-label={liked ? "Unlike" : "Like"}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Heart
          size={20}
          className="transition-transform"
          fill={liked ? "currentColor" : "none"}
          stroke={liked ? "currentColor" : "currentColor"}
        />
      )}
      {showText && `${count} ${count === 1 ? "Like" : "Likes"}`}
    </button>
  );
}
