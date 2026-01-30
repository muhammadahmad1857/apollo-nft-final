/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNFT, useAuction, useUpdateNFT } from "@/hooks/useNft";
import { useListNFT, useCancelListing, useListing } from "@/hooks/useMarketplace";
import { useUpdateRoyalty } from "@/hooks/useUpdateRoyalty";
import { marketplaceAddress } from "@/lib/wagmi/contracts";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PinataJSON } from "@/types";

export default function EditRoyaltyPage() {
  const params = useParams();
  const { tokenid } = params;

  const { updateRoyalty, isPending: isRoyaltyPending } = useUpdateRoyalty();
  const { data: token, isLoading: loading, error: nftError } = useNFT(
    tokenid ? Number(Array.isArray(tokenid) ? tokenid[0] : tokenid) : undefined
  );
  const updateNFTMutation = useUpdateNFT();

  const [royalty, setRoyalty] = useState(500);
  const [isListed, setIsListed] = useState(false);
  const [priceEth, setPriceEth] = useState("");
  const [tokenJson, setTokenJson] = useState<PinataJSON | null>(null);
  const [initial, setInitial] = useState({
    royalty: 500,
    isListed: false,
    priceEth: "",
  });

  const { listNFT } = useListNFT();
  const { cancelListing, isPending: isCanceling } = useCancelListing();

  const tokenIdStr = Array.isArray(tokenid) ? tokenid[0] : tokenid;
  const { data: listing, refetch: refetchListing } = useListing(
    tokenIdStr ? BigInt(tokenIdStr) : BigInt(0)
  ) as {
    data: [string, string] | undefined;
    refetch: () => void;
  };

  useEffect(() => {
    if (!token) return;

    setRoyalty(token.royaltyBps ?? 500);
    setIsListed(token.isListed ?? false);

    const price = token.mintPrice
      ? (Number(token.mintPrice) / 1e18).toString()
      : "";

    setPriceEth(price);
    setInitial({
      royalty: token.royaltyBps ?? 500,
      isListed: token.isListed ?? false,
      priceEth: price,
    });

    if (token.tokenUri?.startsWith("ipfs://")) {
      const url = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${token.tokenUri.replace(
        "ipfs://",
        ""
      )}`;
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => setTokenJson(json))
        .catch(() => setTokenJson(null));
    }

    refetchListing();
  }, [token?.tokenUri]);

  const isRoyaltyChanged = royalty !== initial.royalty;
  const isListingChanged =
    isListed !== initial.isListed || priceEth !== initial.priceEth;

  const handleUpdateRoyalty = async () => {
    if (!token || !isRoyaltyChanged) return;

    try {
      await updateRoyalty(
        marketplaceAddress as `0x${string}`,
        BigInt(token.tokenId),
        BigInt(royalty)
      );

      await updateNFTMutation.mutateAsync({
        id: token.id,
        data: { royaltyBps: royalty },
      });

      toast.success("Royalty updated successfully ✨");
    } catch (err: any) {
      toast.error("Failed to update royalty", {
        description: err?.message,
      });
    }
  };

  const handleUpdateListing = async () => {
    if (!token || !isListingChanged) return;

    try {
      const mintPrice = priceEth ? Math.floor(Number(priceEth) * 1e18) : 0;

      await updateNFTMutation.mutateAsync({
        id: token.id,
        data: { isListed, mintPrice },
      });

      if (isListed && priceEth) {
        await listNFT(BigInt(token.tokenId), priceEth);
        refetchListing();
      }

      toast.success("Marketplace updated 🛒");
    } catch (err: any) {
      toast.error("Failed to update listing", {
        description: err?.message,
      });
    }
  };

  const handleCancelListing = async () => {
    if (!tokenIdStr) return;

    try {
      await cancelListing(BigInt(tokenIdStr));
      setIsListed(false);
      refetchListing();
      toast.success("Listing cancelled ❌");
    } catch (err: any) {
      toast.error("Failed to cancel listing", {
        description: err?.message,
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-muted-foreground">
        Loading NFT...
      </div>
    );

  if (nftError)
    return <div className="p-8 text-center text-red-500">{nftError.message}</div>;

  if (!token) return null;

  const identifier = tokenJson?.name || "Unknown NFT";
  const cover = tokenJson?.cover;

  return (
    <div className="flex flex-col items-center min-h-[80vh] bg-background">
      <div className="w-full max-w-2xl px-2 pt-6 pb-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <Card className="w-full max-w-2xl shadow-xl rounded-2xl border overflow-hidden">
        {/* NFT HEADER */}
        <div className="flex gap-6 p-6 border-b bg-gradient-to-br from-cyan-500/5 to-purple-500/5">
          {cover && (
            <img
              src={cover}
              alt="NFT"
              className="w-28 h-28 rounded-xl object-cover border"
            />
          )}

          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-cyan-600">{identifier}</h2>
            <p className="text-sm text-muted-foreground">
              Token #{token.tokenId}
            </p>

            <div className="flex gap-4 mt-3 text-xs">
              <span className="px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-600">
                Royalty: {(royalty / 100).toFixed(2)}%
              </span>
              <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-600">
                {isListed ? "Listed" : "Not Listed"}
              </span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="p-6">
          <Tabs defaultValue="royalty">
            <TabsList className="grid grid-cols-2 mb-6 rounded-xl bg-muted">
              <TabsTrigger value="royalty">⚙️ Royalty</TabsTrigger>
              <TabsTrigger value="marketplace">🛒 Marketplace</TabsTrigger>
            </TabsList>

            {/* ROYALTY TAB */}
            <TabsContent value="royalty">
              <div className="space-y-6">
                <div className="bg-muted/40 p-5 rounded-xl border">
                  <Label className="text-lg font-semibold text-cyan-600">
                    Creator Royalty
                  </Label>

                  <div className="flex items-center gap-4 mt-4">
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      step={10}
                      value={royalty}
                      onChange={(e) => setRoyalty(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="text-right min-w-[90px]">
                      <div className="text-sm text-muted-foreground">BPS</div>
                      <div className="text-lg font-bold text-cyan-600">
                        {royalty}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    Creator earns{" "}
                    <span className="font-semibold text-cyan-600">
                      {(royalty / 100).toFixed(2)}%
                    </span>{" "}
                    from each resale.
                  </p>
                </div>

                <Button
                  onClick={handleUpdateRoyalty}
                  disabled={!isRoyaltyChanged || isRoyaltyPending}
                  className="w-full rounded-xl py-3 text-lg bg-cyan-600 hover:bg-cyan-700"
                >
                  {isRoyaltyPending ? "Updating..." : "Update Royalty"}
                </Button>
              </div>
            </TabsContent>

            {/* MARKETPLACE TAB */}
            <TabsContent value="marketplace">
              <div className="space-y-6">
                <div className="bg-muted/40 p-5 rounded-xl border">
                  <Label className="text-lg font-semibold text-purple-600">
                    Marketplace Listing
                  </Label>

                  <div className="flex items-center gap-3 mt-4">
                    <input
                      type="checkbox"
                      checked={isListed}
                      onChange={(e) => setIsListed(e.target.checked)}
                      className="w-5 h-5 accent-purple-600"
                    />
                    <span className="text-sm">
                      {isListed
                        ? "NFT is listed on marketplace"
                        : "NFT is not listed"}
                    </span>
                  </div>

                  {isListed && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm text-purple-600">
                        Price (ETH)
                      </Label>
                      <input
                        type="number"
                        value={priceEth}
                        onChange={(e) => setPriceEth(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-background w-full"
                        placeholder="0.05"
                      />
                    </div>
                  )}
                </div>

                {listing &&
                  listing[0] !==
                    "0x0000000000000000000000000000000000000000" && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm">
                      Listed for{" "}
                      <span className="font-semibold text-green-600">
                        {Number(listing[1]) / 1e18} ETH
                      </span>{" "}
                      by {listing[0].slice(0, 6)}...{listing[0].slice(-4)}
                    </div>
                  )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleUpdateListing}
                    disabled={updateNFTMutation.isPending || !isListingChanged}
                    className="flex-1 rounded-xl py-3 bg-purple-600 hover:bg-purple-700"
                  >
                    Update Listing
                  </Button>

                  {isListed && (
                    <Button
                      onClick={handleCancelListing}
                      disabled={isCanceling}
                      variant="destructive"
                      className="rounded-xl"
                    >
                      {isCanceling ? "Cancelling..." : "Unlist"}
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
