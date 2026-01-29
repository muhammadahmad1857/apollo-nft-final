import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Share, Edit, ShoppingCart, Gavel } from "lucide-react";
import Image from "next/image";

interface NFTCardProps {
  nft: {
    id: number;
    tokenId: number;
    title: string;
    likes: number;
    image: string;
    minted: boolean;
    isListed?: boolean;
    price?: number;
  };
  owner?: boolean;
  auction?: {
    id: number;
    nftId: number;
    startTime: string;
    endTime: string;
    settled: boolean;
  } | null;
  onEditRoyalty?: () => void;
  onBuy?: () => void;
  onShare?: () => void;
  onStartAuction?: () => void;
  onAuction?: () => void;
}
export function NFTCard({ nft, owner = true, auction, onEditRoyalty, onBuy, onShare, onStartAuction, onAuction }: NFTCardProps) {
  return (
    <Card className="p-0 overflow-hidden bg-card dark:bg-card-dark shadow-lg hover:shadow-xl transition-shadow">
      <div className="relative">
        <Image src={nft.image} alt={nft.title} width={400} height={192} className="w-full h-48 object-cover" />
        {owner && nft.minted && (
          <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded text-white font-bold bg-cyan-400">Minted</span>
        )}
        <button
          className="absolute top-2 left-2 bg-background/80 dark:bg-background/80 rounded-full p-2 hover:bg-primary/20 transition"
          onClick={onShare}
          title="Share"
        >
          <Share className="text-lg text-primary" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="font-semibold text-lg truncate" title={nft.title}>{nft.title}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>❤ {nft.likes} Likes</span>
        </div>
        {owner ? (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={onEditRoyalty}
            >
              <Edit /> Edit Royalty
            </Button>
            {nft.minted && !auction && (
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                onClick={onStartAuction}
              >
                <Gavel /> Start Auction
              </Button>
            )}
            {auction && (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                disabled
              >
                <Gavel /> Auction Live
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            {auction ? (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                onClick={onAuction}
              >
                <Gavel /> Auction
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                onClick={onBuy}
              >
                <ShoppingCart /> Buy
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
