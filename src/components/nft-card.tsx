"use client";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Share, Edit, Heart } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";

import { UniversalMediaIcon } from "./ui/UniversalMediaIcon";
import { NFTLikeModel, NFTModel } from "@/generated/prisma/models";
import Link from "next/link";

interface NFTCardProps {
  nft: NFTModel & { likes?: NFTLikeModel[] };
  owner?: boolean;
  onBuy?: () => void;
}

export function NFTCard({ nft, owner = true, onBuy }: NFTCardProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [playlists, setPlaylists] = useState<{ id: number; name: string }[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!owner || !address) return;

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
  }, [address, owner]);

  const handleShare = () => {
    if (!nft.isListed) {
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

  const handleAddToPlaylist = async () => {
    if (!address || !selectedPlaylistId) {
      toast.error("Select a playlist first");
      return;
    }

    setIsAddingToPlaylist(true);
    try {
      const response = await fetch(`/api/playlists/${selectedPlaylistId}/items?walletAddress=${address}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId: nft.id }),
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
        {/* <button
          className="bg-background/80 rounded-full p-2 hover:bg-primary/20 transition"
          onClick={handleEditPage}
          title="Edit NFT"
        >
          <Edit className="text-lg text-primary" />
        </button> */}
      </div>

      {/* Media as Main Focus */}
      <div className="relative">
        {nft.isListed && (
          <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded text-white font-bold bg-cyan-400 z-5">
            Listed
          </span>
        )}
        {nft.tokenUri && (
          <div className="w-full">
            <UniversalMediaViewer
              tokenUri={nft.tokenUri}
              uri={nft.mediaUrl}
              fileType={nft.fileType}
              gateway={process.env.NEXT_PUBLIC_GATEWAY_URL}
              className="w-full"
              style={{ height: 320 }}
            />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Title and Cover Image Avatar */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 flex items-center gap-3">
            {nft.imageUrl && (
              <Image
                src={nft.imageUrl.replace(
                  "ipfs://",
                  `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`,
                )}
                alt={nft.title}
                width={56}
                height={56}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
            )}
            {!nft.imageUrl && nft.tokenUri && (
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                <UniversalMediaIcon
                  tokenUri={nft.tokenUri}
                  uri={nft.mediaUrl}
                  fileType={nft.fileType}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-base truncate"
                title={nft.title}
              >
                {nft.title}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <span>
              <Heart fill="red" color="red" size={16} />
            </span>{" "}
            <p>{nft.likes?.length || 0}</p>
          </div>
        </div>

        {owner && (
          <div className="flex flex-col gap-2">
            {/* Use dialog/modal for MarketplaceListing */}
            {/* <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 w-full"
                >
                  <Edit /> Add to marketplace
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl w-full">
                <DialogHeader>
                  <DialogTitle>Edit Marketplace Listing</DialogTitle>
                  <DialogClose />
                </DialogHeader>
                <MarketplaceListing token={nft} />
              </DialogContent>
            </Dialog> */}
            <Link
              href={`/dashboard/list-marketplace/${nft.tokenId}/`}
              className="w-full"
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 w-full"
              >
                <Edit /> Add to marketplace
              </Button>
            </Link>
            {!nft.approvedMarket ? (
              // <CreateAuctionButton
              //   tokenId={BigInt(nft.tokenId)}
              //   approvedAuction={nft.approvedAuction}
              //   nftId={nft.id}
              // />
              <Link
              href={`/dashboard/create-auction/${nft.tokenId}/`}
              className="w-full"
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 w-full"
              >
                <Edit /> Create Auction
              </Button>
            </Link>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                This NFT is already approved for marketing and cannot be
                approved for the auction.
              </p>
            )}

            <div className="flex items-center gap-2">
              <select
                value={selectedPlaylistId ?? ""}
                onChange={(e) => setSelectedPlaylistId(Number(e.target.value))}
                className="h-9 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm"
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

              <Button
                variant="outline"
                size="sm"
                disabled={isAddingToPlaylist || playlists.length === 0}
                onClick={handleAddToPlaylist}
              >
                {isAddingToPlaylist ? "Adding..." : "Add to Playlist"}
              </Button>
            </div>
          </div>
        )}

        {!owner && (
          <Button
            variant="default"
            size="sm"
            className="w-full flex items-center gap-2 justify-center"
            onClick={onBuy}
          >
            Buy
          </Button>
        )}
      </div>
    </Card>
  );
}
