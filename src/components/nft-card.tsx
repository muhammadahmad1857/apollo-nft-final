// components/nft-card.tsx
"use client";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Share, Edit, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NFTCardProps {
  nft: {
    id: number;
    title: string;
    likes: number;
    image: string;
    minted: boolean;
  };
  owner?: boolean;
  onEditRoyalty?: () => void;
  onBuy?: () => void;
  onShare?: () => void;
}

export function NFTCard({ nft, owner = true, onEditRoyalty, onBuy, onShare }: NFTCardProps) {
  const router = useRouter();

  const handleEditRoyalty = () => {
    if (onEditRoyalty) return onEditRoyalty();
    router.push(`/dashboard/token/${nft.id}/edit`);
  };

  const handleShare = () => {
    if (!nft.minted) {
      toast.info("List this NFT first to share");
      return;
    }
    const url = `${window.location.origin}/marketplace/${nft.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Card className="p-0 overflow-hidden bg-card shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative">
        <Image
          src={nft.image}
          alt={nft.title}
          width={400}
          height={192}
          className="w-full h-48 object-cover"
        />
        {nft.minted && (
          <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded text-white font-bold bg-cyan-400">
            Minted
          </span>
        )}
        <button
          className="absolute top-2 left-2 bg-background/80 rounded-full p-2 hover:bg-primary/20 transition"
          onClick={handleShare}
          title="Share"
        >
          <Share className="text-lg text-primary" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="font-semibold text-lg truncate" title={nft.title}>{nft.title}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>❤ {nft.likes}</span>
        </div>
        {owner ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 flex items-center gap-2"
            onClick={handleEditRoyalty}
          >
            <Edit /> Edit Royalty
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="mt-2 flex items-center gap-2"
            onClick={onBuy}
          >
            <ShoppingCart /> Buy
          </Button>
        )}
      </div>
    </Card>
  );
}
