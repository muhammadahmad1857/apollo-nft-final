/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { useNFT, useUpdateNFT } from "@/hooks/useNft";
import {
  useListNFT,
  useCancelListing,
  useListing,
} from "@/hooks/useMarketplace";
import { useUpdateRoyalty } from "@/hooks/useUpdateRoyalty";
import { marketplaceAddress } from "@/lib/wagmi/contracts";
import { PinataJSON } from "@/types";
import { ApproveMarketButton } from "@/components/marketplace/marketplaceApproveButton"; // Market approve button
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";

export default function EditRoyaltyPage() {
  const { tokenid } = useParams();
  const {address} = useAccount()
  const { data: user, refetch:userRefetch, isLoading: isUserLoading } = useUser(address || "");

  const tokenId = Number(Array.isArray(tokenid) ? tokenid[0] : tokenid);

  const { data: token, isLoading } = useNFT(tokenId);
  const updateNFT = useUpdateNFT();
  const { updateRoyalty, isPending: royaltyPending } = useUpdateRoyalty();

  const { listNFT } = useListNFT();
  const { cancelListing, isPending: cancelPending } = useCancelListing();
  const { data: listing, refetch } = useListing(BigInt(tokenId)) as {
    data?: [string, string];
    refetch: () => void;
  };

  const [royalty, setRoyalty] = useState(500);
  const [isListed, setIsListed] = useState(false);
  const [priceEth, setPriceEth] = useState("");
  const [meta, setMeta] = useState<PinataJSON | null>(null);
// Show error if user fetch failed
useEffect(() => {
  if (!isUserLoading && !user) {
    toast.error("Something went wrong while fetching user.");
  }
}, [user, isUserLoading]); 

  /** -------------------------------
   * Init state
   -------------------------------- */
  useEffect(() => {
    if (!token) return;

    setRoyalty(token.royaltyBps ?? 500);
    setIsListed(token.isListed ?? false);
    setPriceEth(token.mintPrice ? Number(token.mintPrice).toString() : "");

    if (token.tokenUri?.startsWith("ipfs://")) {
      fetch(
        `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${token.tokenUri.replace(
          "ipfs://",
          ""
        )}`
      )
        .then((r) => r.json())
        .then(setMeta)
        .catch(() => null);
    }

    refetch();
  }, [token]);

  const hasRoyaltyChanged = royalty !== token?.royaltyBps;
  const hasListingChanged =
    isListed !== token?.isListed ||
    priceEth !== (token?.mintPrice ? Number(token.mintPrice).toString() : "");

  /** -------------------------------
   * Handlers
   -------------------------------- */
  async function handleSaveRoyalty() {
    if (!token || !hasRoyaltyChanged) return;

    try {
      // 1️⃣ On-chain
      await updateRoyalty(
        marketplaceAddress as `0x${string}`,
        BigInt(token.tokenId),
        BigInt(royalty)
      );

      // 2️⃣ DB
      await updateNFT.mutateAsync({
        id: token.id,
        data: { royaltyBps: royalty },
      });

      toast.success("Royalty updated successfully");
    } catch (err: any) {
      toast.error("Royalty update failed", {
        description: err?.message,
      });
    }
  }

  async function handleSaveListing() {
    if (!token || !hasListingChanged) return;

    try {
      // Cancel existing listing if needed
      if (!isListed && token.isListed) {
        await cancelListing(BigInt(token.tokenId));
      }

      // Create / update listing on-chain
      if (isListed && priceEth) {
        await listNFT(BigInt(token.tokenId), priceEth);
      }

      // Update DB after chain success
      await updateNFT.mutateAsync({
        id: token.id,
        data: {
          isListed,
          mintPrice: priceEth ? Math.floor(Number(priceEth)) : 0,
        },
      });

      refetch();
      toast.success("Marketplace updated");
    } catch (err: any) {
      toast.error("Marketplace update failed", {
        description: err?.message,
      });
    }
  }

  if (isLoading)
    return <div className="text-center py-20">Loading NFT...</div>;
  if (!token) return <div className="text-center py-20">NFT not found</div>;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm mb-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <Card className="overflow-hidden">
        {/* HEADER */}
        <CardHeader className="flex flex-row gap-4 items-center bg-muted/50">
          {meta?.cover && (
            <img
              src={meta.cover.replace(
                "ipfs://",
                `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`
              )}
              alt=""
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          <div>
            <h2 className="text-xl font-bold">{meta?.name}</h2>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">
                {(royalty / 100).toFixed(2)}% royalty
              </Badge>
              <Badge variant={isListed ? "default" : "outline"}>
                {isListed ? "Listed" : "Not listed"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="royalty">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="royalty">Royalty</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            </TabsList>

            {/* ROYALTY TAB */}
            <TabsContent value="royalty" className="space-y-6">
              <div>
                <Label>Royalty (BPS)</Label>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={10}
                  value={royalty}
                  onChange={(e) => setRoyalty(Number(e.target.value))}
                  className="w-full mt-3 accent-primary"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {(royalty / 100).toFixed(2)}% creator royalty
                </p>
              </div>

              <Button
                className="w-full"
                disabled={!hasRoyaltyChanged || royaltyPending}
                onClick={handleSaveRoyalty}
              >
                Save Royalty
              </Button>
            </TabsContent>

            {/* MARKETPLACE TAB */}
            <TabsContent value="marketplace" className="space-y-6">
              {/* Render ApproveMarketButton if not approved */}
              {!user ? (
          <p>Loading user...</p>
        ) : !user.approvedAuction ? (
                <ApproveMarketButton
                  userId={user.id}
                  onSuccess={() => userRefetch()}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label>List on marketplace</Label>
                    <Switch checked={isListed} onCheckedChange={setIsListed} />
                  </div>

                  {isListed && (
                    <div>
                      <Label>Price (Apollo)</Label>
                      <Input
                        type="number"
                        value={priceEth}
                        onChange={(e) => setPriceEth(e.target.value)}
                        placeholder="0.05"
                      />
                    </div>
                  )}

                  {listing && listing[0] !== ZERO_ADDRESS && (
                    <p className="text-sm text-muted-foreground">
                      On-chain price:{" "}
                      <strong>{Number(listing[1])} Apollo</strong>
                    </p>
                  )}

                  <Button
                    className="w-full"
                    disabled={cancelPending || updateNFT.isPending}
                    onClick={handleSaveListing}
                  >
                    Save Marketplace
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
