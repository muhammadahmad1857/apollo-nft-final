"use client";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Share, Edit, Music, Heart } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CreateAuctionButton } from "./auction/createAuctionButton";
import { useEffect, useState } from "react";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";
import { MarketplaceListing } from "./marketplace/editMarketplace"; // our modal component
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { UniversalMediaIcon } from "./ui/UniversalMediaIcon";

interface NFTCardProps {
  nft: {
    id: number;
    title: string;
    likes: number;
    image: string;
    minted: boolean;
    isApproved: boolean;
    tokenId: number;
    isDisabled: boolean;
    isMarketApproved: boolean;
    tokenUri: string;
  };
  owner?: boolean;
  onBuy?: () => void;
}

export function NFTCard({ nft, owner = true, onBuy }: NFTCardProps) {
  const router = useRouter();
  // Remove old mediaType, mediaUrl, showVideo, and useEffect
  const [mediaUrl, setMediaUrl] = useState("");
 useEffect(() => {
    if (!nft.tokenUri) return;

    const detect = async () => {
      try {
        const res = await fetch(nft.tokenUri);
        const json = await res.json();
        const media = json.media;
        if (!media) return;
        setMediaUrl(media);

      } catch (e) {
        console.error("Media settling failed", e);
      }
    };

    detect();
  }, [nft.tokenUri]);
  const handleShare = () => {
    if (!nft.minted) {
      toast.info("List this NFT first to share");
      return;
    }
    const url = `${window.location.origin}/marketplace/${nft.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleEditPage = () => {
    router.push(`/dashboard/token/${nft.id}/edit`);
  };

  return (
    <Card className="p-0 overflow-hidden bg-card shadow-lg hover:shadow-xl transition-shadow relative">
      {/* Top icons: Share + Edit page */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          className="bg-background/80 rounded-full p-2 hover:bg-primary/20 transition"
          onClick={handleShare}
          title="Share"
        >
          <Share className="text-lg text-primary" />
        </button>
        <button
          className="bg-background/80 rounded-full p-2 hover:bg-primary/20 transition"
          onClick={handleEditPage}
          title="Edit NFT"
        >
          <Edit className="text-lg text-primary" />
        </button>
      </div>

      <div className="relative">
        {nft.image ? (
          <Image
            src={nft.image}
            alt={nft.title}
            width={400}
            height={192}
            className="w-full h-48 object-cover"
          />
        ) : (
         <UniversalMediaIcon tokenUri={nft.tokenUri} className="w-full h-48 object-cover" />
        )}
        {nft.minted && (
          <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded text-white font-bold bg-cyan-400">
            Listed
          </span>
        )}
        <div className="w-full dark:bg-white bg-black h-0.5 my-0.5"></div>
        {/* Media Preview (not cover) */}
        {nft.tokenUri && (
          <div className="px-4 py-2">
            <UniversalMediaViewer
              tokenUri={nft.tokenUri}
              gateway={process.env.NEXT_PUBLIC_GATEWAY_URL}
              className="w-full"
              style={{ maxHeight: 192 }}
            />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
        <div className="font-semibold text-lg truncate" title={nft.title}>
          {nft.title}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span><Heart fill="red" color="red"/> <p>{nft.likes}</p></span>
        </div>
        </div>

        {owner && (
          <div className="flex flex-col gap-2 mt-2">
            {/* Use dialog/modal for MarketplaceListing */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit /> Edit Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl w-full">
                <DialogHeader>
                  <DialogTitle>Edit Marketplace Listing</DialogTitle>
                  <DialogClose />
                </DialogHeader>
                <MarketplaceListing token={nft} />
              </DialogContent>
            </Dialog>

            {!nft.isMarketApproved ? (
              <CreateAuctionButton
                tokenId={BigInt(nft.tokenId)}
                approvedAuction={nft.isApproved}
                nftId={nft.id}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                This NFT is already approved for marketing and cannot be
                approved for the auction.
              </p>
            )}
          </div>
        )}

        {!owner && (
          <Button
            variant="default"
            size="sm"
            className="mt-2 flex items-center gap-2"
            onClick={onBuy}
          >
            Buy
          </Button>
        )}
      </div>

      {/* Video modal removed, handled by UniversalMediaViewer */}
    </Card>
  );
}
