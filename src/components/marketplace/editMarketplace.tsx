"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

import {
  useListNFT,
  useCancelListing,
  useListing,
} from "@/hooks/useMarketplace";
import { useUpdateNFT } from "@/hooks/useNft";
import { ApproveMarketButton } from "@/components/marketplace/marketplaceApproveButton";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "wagmi";
import { NFTModel } from "@/generated/prisma/models";

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000";

interface MarketplaceListingProps {
  token: NFTModel;
}

export function MarketplaceListing({ token }: MarketplaceListingProps) {
  const { address } = useAccount();
  const { data: user, isLoading: isUserLoading } = useUser(address || "");
  const { listNFT } = useListNFT();
  const [marketApproved, setMarketApproved] = useState(token.approvedMarket);
  const { cancelListing, isPending: cancelPending } = useCancelListing();
  const { data: listing } = useListing(
    BigInt(token.tokenId)
  ) as { data?: [string, string]; refetch: () => void };

  const updateNFT = useUpdateNFT();

  const [isListed, setIsListed] = useState(token.isListed??false);
  const [priceEth, setPriceEth] = useState("");

  /** -------------------------------
   * Init from token
   -------------------------------- */
  useEffect(() => {
    if (!token) return;

    setIsListed(token.isListed ?? false);
    setPriceEth(
      token.mintPrice ? Number(token.mintPrice).toString() : ""
    );

  }, [token]);

  /** -------------------------------
   * Save logic
   -------------------------------- */
  async function handleSaveListing() {
    if (!token) return;

    try {
      // Unlist
      if (!isListed && token.isListed) {
        await cancelListing(BigInt(token.tokenId));

        await updateNFT.mutateAsync({
          id: token.id,
          data: { isListed: false, mintPrice: 0 },
        });

        toast.success("NFT unlisted");
        return;
      }

      // List
      if (isListed && priceEth) {
        await listNFT(BigInt(token.tokenId), priceEth);
      }

      await updateNFT.mutateAsync({
        id: token.id,
        data: {
          isListed,
          mintPrice: priceEth ? Number(priceEth) : 0,
        },
      });
      
      toast.success("Marketplace updated");
    } catch (err: any) {
      toast.error("Marketplace update failed", {
        description: err?.message,
      });
    }
  }

  /** -------------------------------
   * Guards
   -------------------------------- */
  if (isUserLoading) {
    return <p>Loading user...</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load user
      </p>
    );
  }

  if (token.approvedAuction) {
    return (
      <p className="text-sm text-muted-foreground">
        This NFT is approved for auction and cannot be listed on the
        marketplace.
      </p>
    );
  }

  if (!marketApproved) {
    return (
      <ApproveMarketButton
        nftId={token.id}
        tokenId={token.tokenId}
        onSuccess={()=>{
setMarketApproved(true);
        }}
      />
    );
  }

  /** -------------------------------
   * UI
   -------------------------------- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label>List on marketplace</Label>
        <Switch
          checked={isListed}
          onCheckedChange={(val) => {
            setIsListed(val);
            if (!val) setPriceEth("");
          }}
        />
      </div>

      {isListed && (
        <div>
          <Label>Price (APOLLO)</Label>
          <Input
            type="number"
            value={priceEth}
            onChange={(e) => setPriceEth(e.target.value)}
            placeholder="0.05"
            disabled={Boolean(token.mintPrice && token.mintPrice > 0)}
          />

          {token.mintPrice && token.mintPrice > 0 && (
            <p className="text-sm text-yellow-600 mt-1">
              Tip: Unlist first to change the price. Unlisting resets
              the price to 0.
            </p>
          )}
        </div>
      )}

      {listing && listing[0] !== ZERO_ADDRESS && (
        <p className="text-sm text-muted-foreground">
          On-chain price:{" "}
          <strong>{Number(listing[1])} APOLLO</strong>
        </p>
      )}

      <Button
        className="w-full"
        disabled={cancelPending || updateNFT.isPending}
        onClick={handleSaveListing}
      >
        {token.isListed?"Remove from marketplace":"Add to marketplace"}
      </Button>
    </div>
  );
}
