"use client";
import {   Share } from "lucide-react";
import {  useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "wagmi";
import { useBuyNFT } from "@/hooks/useMarketplace";
import ShareModal from "./ShareModel";
import LikeButton from "./nftLikes";
import { parseEther } from "viem";
import { transferOwnership } from "@/actions/nft";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UniversalMediaIcon } from "../ui/UniversalMediaIcon";

interface NFTInteractiveContentProps {
  tokenId: number;
  media: string;
  title: string;
  name: string;
  mintPrice?: number;
  ownerAddress?: string | null;
  tokenUri: string;
  fileType?: string;
  nftId:number
  imageUrl?: string ;
}

export default function NFTInteractiveContent({
  tokenId,
  media,
  title,
  name,
  mintPrice,
  ownerAddress,
  tokenUri,
  fileType,
  nftId,
  imageUrl
}: NFTInteractiveContentProps) {
  const { address } = useAccount();
  const { data: user } = useUser(address);
  const { buyNFT, isPending } = useBuyNFT();
 
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
console.log("NFTInteractiveContent props", { tokenId, media, title, name, mintPrice, ownerAddress, tokenUri });
  // Load initial like state and count
  // useEffect(() => {
  //   let mounted = true;

  //   const loadLikes = async () => {
  //     const likes = await getNFTLikesByNFT(nftId);
  //     if (!mounted) return;
  //     setLikeCount(likes.length);

  //     if (user?.id) {
  //       const hasLiked = await checkIfUserLikedNFT(nftId, user.id);
  //       if (!mounted) return;
  //       setLiked(hasLiked);
  //     }
  //   };

  //   loadLikes();

  //   return () => {
  //     mounted = false;
  //   };
  // }, [tokenId, user?.id]);



  // // Handle like toggle
  // const handleLike = async () => {
  //   if (!user?.id) {
  //     toast.error("Connect wallet to like NFTs");
  //     return;
  //   }
  //   if (loadingLike) return;

  //   setLoadingLike(true);
  //   try {
  //     const { liked: newLiked,count:likeCount } = await toggleNFTLike(nftId, user.id);
  //     setLiked(newLiked);
  //     setLikeCount(likeCount );
  //     toast.success(newLiked ? "Added to favorites" : "Removed from favorites");
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to update like");
  //   } finally {
  //     setLoadingLike(false);
  //   }
  // };

  const handleBuy = async () => {
    if (!mintPrice) return toast.error("Mint price not available");

    try {
      
      await buyNFT(BigInt(tokenId), parseEther(String(mintPrice)));
      if (user?.id) {
        await transferOwnership(tokenId, user.id);
      }
      toast.success("NFT purchased successfully!");
    } catch (err: any) {
      console.error("error in buying", err);
      toast.error(err?.message || "Failed to purchase NFT.");
    }
  };

  return (
    <>
      {/* Media Controls */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center sm:justify-start">
         {imageUrl ? (
                        <Image
                          src={imageUrl.replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`)}
                          alt={title || `NFT #${tokenId}`}
                          width={200}
                          height={200}
                          className="w-full aspect-square object-cover"
                          priority
                        />
                      ) : (
                        <UniversalMediaIcon  tokenUri={tokenUri} uri={media} fileType={fileType} className="w-full aspect-square" />
                      )}

        {/* <button
          onClick={handleLike}
          disabled={loadingLike}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
            liked
              ? "bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/30"
              : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-600"
          }`}
        >
          <LikeButton userId={user?.id||0} nftId={nftId} showText={true} />
        </button> */}
        <LikeButton userId={user?.id||0} nftId={nftId} showText={true} />

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 text-white hover:text-cyan-500 transition-colors"
          aria-label="Share"
        >
          <Share size={18} />
          <span className="text-sm font-medium">Share</span>
        </button>

        {mintPrice !== undefined && (
          !address ? (
            <p className="text-sm text-foreground">Connect your wallet to buy</p>
          ) : (
            <button
              onClick={() => setShowBuyConfirm(true)}
              className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:bg-cyan-700/60 disabled:pointer-events-none"
              disabled={isPending || address === ownerAddress}
            >
              {address === ownerAddress
                ? "My NFT"
                : isPending
                ? "Buying..."
                : "Buy"
              }
            </button>
          )
        )}
      </div>

      {/* Fullscreen Video Modal */}
      {/* {showVideo && media && (
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
      )} */}

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} tokenId={tokenId} title={title} name={name} />

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
}
