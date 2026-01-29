"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";
import NFTCard from "@/components/marketplace/nftCard";
import { db } from "@/lib/prisma"; // optional if you call server function
import { toast } from "sonner";
import { NFTModel,UserModel } from "@/generated/prisma/models";
import { getAllNFTs, getNFTByTokenId } from "@/actions/nft";

// Optional: If you want to fetch NFTs via a server function or API


export default function MarketplacePage() {
  const { address } = useAccount();
  const { data: user, isLoading: loadingUser } = useUser(address);

  const [nfts, setNFTs] = useState<(NFTModel & { creator: UserModel | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadNFTs = async () => {
      try {
        const data = await getAllNFTs();
        if (mounted) setNFTs(data);
      } catch (err) {
        console.error("Failed to fetch NFTs", err);
        toast.error("Failed to load NFTs");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNFTs();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Loading NFTs...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.tokenId}
          title={nft.tokenUri}
          description={nft.tokenUri}
          name={nft.creator?.name || nft.creatorId.toString()}
          cover={undefined}
          media={nft.tokenUri}
          minted={true}
          tokenId={nft.tokenId}
          showBuyButton={!!address && !!user?.id} // only show if wallet & user ID exist
        />
      ))}
    </div>
  );
}
