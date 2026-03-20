"use client";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Share, Edit, ListPlus, Heart, Archive, ArchiveRestore, Clock } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { useAccount } from "wagmi";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";

import { UniversalMediaIcon } from "./ui/UniversalMediaIcon";
import { NFTLikeModel, NFTModel } from "@/generated/prisma/models";
import Link from "next/link";
import { AddToPlaylistModal } from "./playlist/AddToPlaylistModal";
import { useUser } from "@/hooks/useUser";
import { useArchiveNFT, useUnarchiveNFT } from "@/hooks/useNft";
import { getProcessingStatus } from "@/lib/nftProcessingState";
import { useIpfsReady } from "@/hooks/useIpfsReady";

interface NFTCardProps {
  nft: NFTModel & { likes?: NFTLikeModel[] };
  owner?: boolean;
  onBuy?: () => void;
}

export function NFTCard({ nft, owner = true, onBuy }: NFTCardProps) {
  const { address } = useAccount();
  const { data: user } = useUser(address || "");
  const archiveMutation = useArchiveNFT();
  const unarchiveMutation = useUnarchiveNFT();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const isArchiveActionPending =
    archiveMutation.isPending || unarchiveMutation.isPending;

  // Processing state: show badge while IPFS gateway hasn't served the file yet
  const isAVMedia =
    nft.fileType?.startsWith("video/") || nft.fileType?.startsWith("audio/");
  const isInProcessingStore =
    isAVMedia && !!nft.mediaUrl
      ? getProcessingStatus(nft.mediaUrl) === "processing"
      : false;
  const ipfsState = useIpfsReady(isInProcessingStore ? nft.mediaUrl : null);
  const isProcessing = isInProcessingStore && ipfsState !== "ready";

  const handleShare = () => {
    if (!nft.isListed) {
      toast.info("List this NFT first to share");
      return;
    }
    const url = `${window.location.origin}/marketplace/${nft.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleArchiveToggle = async () => {
    if (!owner || !user) return;

    try {
      if (nft.isArchived) {
        await unarchiveMutation.mutateAsync({ id: nft.id, ownerId: user.id });
        toast.success("NFT unarchived");
      } else {
        if (nft.isListed) {
          toast.error("Delist this NFT before archiving.");
          return;
        }
        await archiveMutation.mutateAsync({ id: nft.id, ownerId: user.id });
        toast.success("NFT archived");
      }
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to update archive state");
    }
  };

  return (
    <Card className="p-0 overflow-hidden bg-card shadow-lg hover:shadow-xl transition-shadow relative">
      {/* Top icons: Share + Archive toggle */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        {owner && (
          <button
            className="bg-background/80 rounded-full p-2 hover:bg-primary/20 transition disabled:opacity-50"
            onClick={handleArchiveToggle}
            disabled={isArchiveActionPending || !user}
            title={nft.isArchived ? "Unarchive" : "Archive"}
          >
            {nft.isArchived ? (
              <ArchiveRestore className="text-lg text-primary" size={20} />
            ) : (
              <Archive className="text-lg text-primary" size={20} />
            )}
          </button>
        )}
        <button
          className="bg-background/80 rounded-full p-2 hover:bg-primary/20 transition"
          onClick={handleShare}
          title="Share"
        >
          <Share className="text-lg text-primary" />
        </button>
      </div>

      {/* Media as Main Focus */}
      <div className="relative">
        {nft.isListed && (
          <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded text-white font-bold bg-cyan-400 z-5">
            Listed
          </span>
        )}

        {/* Processing badge — only for video/audio that hasn't propagated yet */}
        {isProcessing && (
          <div className="absolute top-2 right-12 z-10 flex items-center gap-1.5 bg-amber-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
            <Clock className="w-3 h-3 animate-pulse" />
            Processing
          </div>
        )}

        {nft.tokenUri && (
          <div className="w-full">
            {isProcessing ? (
              <div className="h-60 sm:h-80 w-full bg-zinc-900 relative overflow-hidden flex flex-col items-center justify-center gap-3">
                {nft.imageUrl && (
                  <Image
                    src={nft.imageUrl.replace(
                      "ipfs://",
                      `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`
                    )}
                    alt={nft.title}
                    fill
                    className="object-cover opacity-30"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-2 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-white">Media Processing</p>
                  <p className="text-xs text-zinc-400">
                    {nft.fileType?.startsWith("video/") ? "Video" : "Audio"} will be playable shortly
                  </p>
                </div>
              </div>
            ) : (
              <UniversalMediaViewer
                tokenUri={nft.tokenUri}
                uri={nft.mediaUrl}
                fileType={nft.fileType}
                gateway={process.env.NEXT_PUBLIC_GATEWAY_URL}
                className="h-60 w-full sm:h-80"
                showDownload={owner}
              />
            )}
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
            {nft.isArchived ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Archived • Cannot list or auction
              </p>
            ) : (
              <>
                {!nft.approvedAuction ? (
                  <Link
                    href={`/dashboard/list-marketplace/${nft.tokenId}/`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-full"
                    >
                      <Edit size={16} /> List
                    </Button>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Approved for auction
                  </p>
                )}

                {!nft.approvedMarket ? (
                  <Link
                    href={`/dashboard/create-auction/${nft.tokenId}/`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-full"
                    >
                      <Edit size={16} /> Auction
                    </Button>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Approved for marketplace
                  </p>
                )}
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-2 w-full"
              onClick={() => setShowPlaylistModal(true)}
            >
              <ListPlus size={16} />
              <span className="hidden sm:inline">Add to Playlist</span>
              <span className="sm:hidden">Playlist</span>
            </Button>
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

      {address && owner && (
        <AddToPlaylistModal
          nftId={nft.id}
          walletAddress={address}
          open={showPlaylistModal}
          onOpenChange={setShowPlaylistModal}
        />
      )}
    </Card>
  );
}
