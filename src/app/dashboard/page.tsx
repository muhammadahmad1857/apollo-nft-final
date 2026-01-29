"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getUserByWallet } from "@/actions/users";
import { getNFTsByOwner } from "@/actions/nft";
import { NFTCard } from "@/components/nft-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpdateRoyalty } from "@/hooks/useUpdateRoyalty";
import { useBuyNFT } from "@/hooks/useMarketplace";
import type { NFTModel, UserModel } from "@/generated/prisma/models";
import type { PinataJSON } from "@/types/index";
import { toast } from "sonner";

export default function Page() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [nfts, setNfts] = useState<(NFTModel & { metadata?: PinataJSON })[]>([]);
  const [search, setSearch] = useState("");
  const [royaltyModal, setRoyaltyModal] = useState<{
    nft?: NFTModel & { metadata?: PinataJSON };
    open: boolean;
  }>({ open: false });

  const { updateRoyalty, isPending: royaltyPending } = useUpdateRoyalty();
  const { buyNFT, isPending: buyPending } = useBuyNFT();

  // Fetch user + NFTs
  useEffect(() => {
    const fetchData = async () => {
      const walletAddress =
        window?.localStorage?.getItem("walletAddress")?.toLowerCase() || "";
      if (!walletAddress) return;

      const userData = await getUserByWallet(walletAddress);
      setUser(userData);

      if (userData?.id) {
        const nftsData = await getNFTsByOwner(userData.id);

        // Fetch metadata for each NFT
        const enriched = await Promise.all(
          nftsData.map(async (nft) => {
            try {
              const res = await fetch(nft.tokenUri);
              const json: PinataJSON = await res.json();
              return { ...nft, metadata: json };
            } catch {
              return nft;
            }
          })
        );

        setNfts(enriched);
      }
    };

    fetchData();
  }, []);

  const filteredNFTs = useMemo(() => {
    return nfts.filter((nft) => {
      if (search && !(nft.metadata?.title || nft.tokenUri).toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [nfts, search]);

  if (!user) {
    return <div className="flex justify-center items-center min-h-[40vh] text-muted-foreground">Loading user...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-8">
      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-1/4 flex flex-col gap-6">
        <Card className="flex flex-col items-center p-6 gap-3">
          <Avatar className="size-24 mb-2">
            <AvatarImage src={user.avatarUrl || "/default-avatar.png"} />
            <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-xl font-bold">{user.name}</div>
          <div className="text-xs text-muted-foreground break-all">{user.walletAddress}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <Button size="sm" className="w-full mt-4">Edit Profile</Button>
        </Card>
        <Card className="p-4 hidden lg:block">
          <div className="text-sm font-semibold">Stats</div>
          <div className="text-2xl font-bold">{nfts.length} NFTs</div>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Search */}
        <Input
          placeholder="Search NFT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* NFT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNFTs.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground">
              No NFTs found.
            </div>
          ) : (
            filteredNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={{
                  id: nft.id,
                  tokenId: nft.tokenId,
                  title: nft.metadata?.title || `NFT #${nft.tokenId}`,
                  image: nft.metadata?.cover || nft.metadata?.media || "/default-nft.png",
                  minted: true,
                  isListed: nft.isListed,
                  price: nft.mintPrice,
                  likes: 0,
                }}
                owner
                onEditRoyalty={() => setRoyaltyModal({ nft, open: true })}
                onBuy={() => buyNFT(BigInt(nft.tokenId), BigInt(Math.floor(nft.mintPrice * 1e18))).then(() => toast.success("Bought!"))}
                onShare={() => toast.info(`Share ${nft.metadata?.title || nft.tokenUri}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* Royalty Modal */}
      {royaltyModal.open && royaltyModal.nft && (
        <Dialog open={royaltyModal.open} onOpenChange={(open) => setRoyaltyModal({ nft: royaltyModal.nft, open })}>
          <DialogContent className="max-w-sm w-full">
            <DialogHeader>
              <DialogTitle>Edit Royalty</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="text-sm">NFT: {royaltyModal.nft.metadata?.title || royaltyModal.nft.tokenUri}</div>
              <input
                type="number"
                placeholder="New royalty BPS (e.g., 500 = 5%)"
                className="border p-2 rounded"
                id="newRoyaltyInput"
              />
              <Button
                disabled={royaltyPending}
                onClick={() => {
                  const input = document.getElementById("newRoyaltyInput") as HTMLInputElement;
                  const newBps = BigInt(Number(input.value));
                  if(!royaltyModal.nft) return;
                  updateRoyalty(undefined, BigInt(royaltyModal.nft.tokenId || 0), newBps)
                    .then(() => toast.success("Royalty updated!"))
                    .catch((e) => toast.error("Error: " + e));
                  setRoyaltyModal({ nft: royaltyModal.nft, open: false });
                }}
              >
                {royaltyPending ? "Updating..." : "Update Royalty"}
              </Button>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
