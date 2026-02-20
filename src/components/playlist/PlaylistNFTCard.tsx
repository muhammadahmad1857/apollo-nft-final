"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { isPlayableNFT, getMediaType } from "@/lib/media";
import type { HTMLAttributes, MouseEvent } from "react";
import { Play, Pause, GripVertical, Heart, Music, Video, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

type NFTWithRelations = {
  id: number;
  tokenId: number;
  name: string;
  title: string;
  imageUrl: string;
  mediaUrl: string;
  description: string;
  fileType: string;
  mintPrice: number;
  creator: {
    id: number;
    name: string;
    walletAddress: string;
    avatarUrl: string | null;
  };
  owner: {
    id: number;
    name: string;
    walletAddress: string;
    avatarUrl: string | null;
  };
  auction: unknown;
  likes: unknown[];
};

type LikedNFT = {
  id: number;
  nftId: number;
  userId: number;
  position: number;
  createdAt: Date;
  nft: NFTWithRelations;
};

interface PlaylistNFTCardProps {
  likedNFT: LikedNFT;
  isDragging?: boolean;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
  index: number;
  totalItems: number;
}

export function PlaylistNFTCard({ 
  likedNFT, 
  isDragging, 
  dragHandleProps,
  index,
  totalItems 
}: PlaylistNFTCardProps) {
  const { currentTrack, isPlaying, isLoading, playTrack } = useAudioPlayer();
  const nft = likedNFT.nft;
  
  const isPlayable = isPlayableNFT(nft);
  const mediaType = getMediaType(nft);
  const isCurrentTrack = currentTrack?.id === nft.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const isCurrentlyLoading = isCurrentTrack && isLoading;

  const handlePlayClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPlayable) {
      playTrack(nft);
    }
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case "audio": return <Music className="w-3 h-3" />;
      case "video": return <Video className="w-3 h-3" />;
      case "image": return <ImageIcon className="w-3 h-3" />;
      case "document": return <FileText className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg
        ${isCurrentTrack 
          ? 'bg-linear-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
          : 'bg-white/5 hover:bg-white/10 border border-transparent'
        }
        transition-all duration-200
        ${isDragging ? 'shadow-2xl ring-2 ring-purple-500/50 cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="shrink-0 cursor-grab active:cursor-grabbing text-white/40 hover:text-white/80 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Track number / Play button */}
      <div className="shrink-0 w-10 h-10 flex items-center justify-center">
        {isPlayable ? (
          <button
            onClick={handlePlayClick}
            disabled={isCurrentlyLoading}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-200 relative
              ${isCurrentlyPlaying 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50' 
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:scale-110'
              }
              ${isCurrentlyLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isCurrentlyLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              </>
            ) : isCurrentlyPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
        ) : (
          <span className="text-sm text-white/40 font-medium">
            {index + 1}
          </span>
        )}
      </div>

      {/* Cover art */}
      <Link 
        href={`/marketplace/${nft.tokenId}`}
        className="shrink-0 relative w-16 h-16 rounded-md overflow-hidden bg-white/5 hover:ring-2 hover:ring-purple-500/50 transition-all"
      >
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl.replace("ipfs://",`https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`)}
            alt={nft.title || nft.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500/20 to-pink-500/20">
            <span className="text-2xl">🎵</span>
          </div>
        )}
        
        {/* Playing/Loading indicator overlay */}
        {isCurrentlyLoading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}
        {isCurrentlyPlaying && !isCurrentlyLoading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-purple-400 rounded-full"
                  animate={{
                    height: ["8px", "16px", "8px"],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </Link>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/marketplace/${nft.tokenId}`}
          className="block hover:text-purple-400 transition-colors"
        >
          <h3 className={`
            text-sm font-semibold truncate
            ${isCurrentTrack ? 'text-purple-300' : 'text-white'}
          `}>
            {nft.title || nft.name}
          </h3>
        </Link>
        
        <Link 
          href={`/artist/${nft.creator.walletAddress}`}
          className="block hover:text-purple-400 transition-colors"
        >
          <p className="text-xs text-white/60 truncate hover:text-white/80">
            {nft.creator.name}
          </p>
        </Link>

        <div className="flex items-center gap-2 mt-1">
          <span className={`
            inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
            ${isPlayable 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-white/10 text-white/40'
            }
          `}>
            {getMediaIcon()}
            <span className="capitalize">{mediaType}</span>
          </span>
          
          <span className="text-xs text-white/40">
            {nft.likes.length} <Heart className="w-3 h-3 inline" />
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right hidden md:block">
        <p className="text-sm font-semibold text-white">
          {nft.mintPrice.toFixed(4)} ETH
        </p>
        <p className="text-xs text-white/40">
          Mint Price
        </p>
      </div>

      {/* Position indicator (shown when dragging) */}
      {isDragging && (
        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          {index + 1} / {totalItems}
        </div>
      )}
    </motion.div>
  );
}
