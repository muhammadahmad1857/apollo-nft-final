"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NFTCard } from "@/components/nft-card";
import { useUser } from "@/hooks/useUser"; // your wagmi-based hook
import { truncateAddress } from "@/lib/truncate";
import * as nftActions from "@/actions/nft"; // your server actions
import { useAccount } from "wagmi";
import { AuctionModel, NFTLikeModel, NFTModel, UserModel } from "@/generated/prisma/models";
import Loader from "@/components/loader";

export default function Page() {
  const router = useRouter();
  const {address} = useAccount()
  const { data: user, } = useUser(address||""); // gets current logged-in wallet
  const [nfts, setNFTs] = React.useState<(NFTModel & { likes?: NFTLikeModel[],auction?: AuctionModel|null, owner?: UserModel })[]>([]);
  const [search, setSearch] = React.useState("");
  const [filterMinted, setFilterMinted] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!address) return;

    async function fetchNFTs() {
      setLoading(true);
      try {
        const ownedNFTs = await nftActions.getNFTsByOwner(user!.id,true);
        setNFTs(ownedNFTs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [address, user?.id]);

  const filteredNFTs = nfts.filter((nft) => {
    if (filterMinted && !nft.isListed) return false;
    if (!nft.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!user) return <div>Connect your wallet to view your NFTs</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-8">
      {/* LEFT SIDEBAR */}
      <div className="max-w-full lg:w-1/4 flex flex-col gap-6">
        <Card className="flex flex-col items-center p-6 gap-3">
          <Avatar className="size-24 mb-2">
            <AvatarImage src={user.avatarUrl ?? ""} alt={user.name} />
            <AvatarFallback className="rounded-lg">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-xl font-bold">{user.name}</div>
          <div className="text-muted-foreground">{truncateAddress(user.walletAddress)}</div>
          <Button size="sm" className="w-full mt-4" onClick={() => router.push("/dashboard/edit-profile")}>Edit Profile</Button>
        </Card>

        {/* Stats */}
        <Card className="p-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Stats</span>
            <span className="text-muted-foreground">NFTs Owned</span>
          </div>
          <div className="text-2xl font-bold">{nfts.length}</div>
        </Card>

        {/* Minted filter */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span>Show only listed</span>
            <input
              type="checkbox"
              checked={filterMinted}
              onChange={(e) => setFilterMinted(e.target.checked)}
            />
          </div>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Search */}
        <Input
          placeholder="Search your NFT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <Loader text="Loading NFT's..."/>
        ) : filteredNFTs.length === 0 ? (
<div className="text-center py-5 text-muted-foreground space-y-2">
  <div>No NFTs found.</div>
  <Button
    variant="outline"
    size="sm"
    onClick={() => router.refresh()}
  >
    Refresh
  </Button>
</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2  gap-6">
            {filteredNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                owner={nft.ownerId === user.id}
                
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
