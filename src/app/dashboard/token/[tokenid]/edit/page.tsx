

"use client"
import { useState, useEffect, FormEvent, useMemo } from "react";
import { useParams } from "next/navigation";
// import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNFT, useAuction, useUpdateNFT } from "@/hooks/useNft";
import { useListNFT, useCancelListing, useListing } from "@/hooks/useMarketplace";
import { useUpdateRoyalty } from "@/hooks/useUpdateRoyalty";
import { marketplaceAddress } from "@/lib/wagmi/contracts";
import { toast } from "sonner";
import * as Tooltip from "@/components/ui/tooltip";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PinataJSON } from "@/types";

export default function EditRoyaltyPage() {
  const params = useParams();
  const { tokenid } = params;
  // const { address } = useAccount();
    const { updateRoyalty, isPending: isRoyaltyPending } = useUpdateRoyalty();
  const { data: token, isLoading: loading, error: nftError } = useNFT(tokenid ? Number(Array.isArray(tokenid) ? tokenid[0] : tokenid) : undefined);
  const { data: auction } = useAuction(token?.id);
  const updateNFTMutation = useUpdateNFT();
  const [royalty, setRoyalty] = useState(500);
  const [isListed, setIsListed] = useState(false);
  const [success, setSuccess] = useState("");
  const [priceEth, setPriceEth] = useState("");
  const [tokenJson, setTokenJson] = useState<PinataJSON|null>(null);
  const [initial, setInitial] = useState<{royalty: number; isListed: boolean; priceEth: string}>({royalty: 500, isListed: false, priceEth: ""});

  // Marketplace hooks
  const { listNFT } = useListNFT();
  const { cancelListing, isPending: isCanceling } = useCancelListing();
  const tokenIdStr = Array.isArray(tokenid) ? tokenid[0] : tokenid;
  const { data: listing, refetch: refetchListing } = useListing(tokenIdStr ? BigInt(tokenIdStr) : BigInt(0)) as {
    data: [string, string] | undefined;
    refetch: () => void;
  };

  useEffect(() => {
    if (!token) return;
    setRoyalty(token.royaltyBps ?? 500);
    setIsListed(token.isListed ?? false);
    setInitial({
      royalty: token.royaltyBps ?? 500,
      isListed: token.isListed ?? false,
      priceEth: token.mintPrice ? (Number(token.mintPrice) / 1e18).toString() : ""
    });
    setPriceEth(token.mintPrice ? (Number(token.mintPrice) / 1e18).toString() : "");
    if (token.tokenUri && token.tokenUri.startsWith("ipfs://")) {
      const url = `https://gateway.pinata.cloud/ipfs/${token.tokenUri.replace("ipfs://", "")}`;
      fetch(url)
        .then(res => (res.ok ? res.json() : null))
        .then(json => setTokenJson(json))
        .catch(() => setTokenJson(null));
    } else {
      setTokenJson(null);
    }
    refetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.tokenUri]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess("");
    if (!token) return;
    // If listed, update mintPrice to priceEth
    const mintPrice = priceEth ? Math.floor(Number(priceEth) * 1e18) : 0;
    updateNFTMutation.mutate(
      { id: token.id, data: { royaltyBps: royalty, isListed, mintPrice } },
      {
        onSuccess: async () => {
          // If royalty changed, update on-chain
          if (royalty !== initial.royalty) {
            try {
              await updateRoyalty(marketplaceAddress as `0x${string}`, BigInt(token.tokenId), BigInt(royalty));
              toast.success("Royalty updated on-chain!", { style: { background: '#06b6d4', color: '#fff' } });
            } catch (err) {
              const error = err as { message?: string };
              toast.error("Failed to update royalty on-chain", { description: error?.message || undefined, style: { background: '#e11d48', color: '#fff' } });
            }
          }
          // If listed and price changed, list on marketplace
          if (isListed && priceEth && priceEth !== initial.priceEth) {
            try {
              await listNFT(BigInt(token.tokenId), priceEth);
              toast.success("NFT listed on marketplace!", { style: { background: '#06b6d4', color: '#fff' } });
              refetchListing();
            } catch (err) {
              const error = err as { message?: string };
              toast.error("Failed to list NFT", { description: error?.message || undefined, style: { background: '#e11d48', color: '#fff' } });
            }
          }
          setSuccess("NFT updated successfully.");
          toast.success("NFT updated successfully!", { style: { background: '#06b6d4', color: '#fff' } });
        },
        onError: (err: unknown) => {
          const error = err as { message?: string };
          toast.error("Failed to update NFT", { description: error?.message || undefined, style: { background: '#e11d48', color: '#fff' } });
        }
      }
    );
  };

  // Remove handleListNFT (logic now in handleSubmit)

  // Cancel NFT listing
  const handleCancelListing = async () => {
    if (!tokenid) return;
    try {
      await cancelListing(BigInt(tokenIdStr ? BigInt(tokenIdStr) : BigInt(0)));
      toast.success("Listing cancelled!", { style: { background: '#06b6d4', color: '#fff' } });
      refetchListing();
      setIsListed(false);
    } catch (err) {
      const error = err as { message?: string };
      toast.error("Failed to cancel listing", { description: error?.message || undefined, style: { background: '#e11d48', color: '#fff' } });
    }
  };

  const handleStartAuction = () => {
    // TODO: Implement start auction modal/flow
    alert("Start Auction modal coming soon!");
  };

  // Remove handleUpdateRoyaltyOnChain (logic now in handleSubmit)


  // Only enable update if something changed
  const isChanged = useMemo(() => {
    return (
      royalty !== initial.royalty ||
      isListed !== initial.isListed ||
      priceEth !== initial.priceEth
    );
  }, [royalty, isListed, priceEth, initial]);

  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><span className="text-muted-foreground">Loading...</span></div>;
  if (nftError) return <div className="p-8 text-center text-destructive">{nftError.message}</div>;
  if (!token) return null;

  // Get identifier from tokenJson (name field)
  const identifier = tokenJson?.name || "-";
  const pinataImage = tokenJson?.cover || null;
  const ipfsUrl = token?.tokenUri?.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${token.tokenUri.replace("ipfs://", "")}` : null;
  const cover = tokenJson?.cover as string | undefined;
  const media = tokenJson?.media as string | undefined;

  return (
    <div className="flex flex-col justify-center items-center min-h-[80vh] bg-background">
      <div className="w-full max-w-md px-2 pt-6 pb-2">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
      <Card className="w-full max-w-md border shadow-sm flex flex-col items-center p-0">
        <CardHeader className="w-full border-b pb-4 flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold text-center w-full text-cyan-600 dark:text-cyan-400">Edit {identifier}</CardTitle>
          <CardDescription className="text-xs mt-1 text-muted-foreground text-center w-full">Token #{token.tokenId}</CardDescription>
        </CardHeader>
        {pinataImage && (
          <div className="w-full flex justify-center py-4 border-b">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pinataImage} alt="Pinata Preview" className="max-h-48 rounded-md object-contain border bg-muted" style={{maxWidth:'100%'}} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full px-8 py-8">
          <div className="flex flex-col gap-4 border-b pb-6">
            <Label htmlFor="royalty" className="text-base font-semibold text-cyan-700 dark:text-cyan-300">Royalty</Label>
            <div className="flex items-center gap-4">
              <input
                id="royalty"
                type="range"
                min={0}
                max={1000}
                step={10}
                value={royalty}
                onChange={e => setRoyalty(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all shadow-inner"
                style={{ boxShadow: '0 0 0 2px #06b6d4' }}
              />
              <span className="w-14 text-right text-sm text-gray-500 dark:text-gray-400">{royalty} bps</span>
              <span className="font-semibold text-cyan-600 dark:text-cyan-300">{(royalty / 100).toFixed(2)}%</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Set the royalty for secondary sales (0-10%).</span>
          </div>
          <div className="flex flex-col gap-4 border-b pb-6">
            <Label htmlFor="isListed" className="text-base font-semibold text-cyan-700 dark:text-cyan-300">Listing</Label>
            <div className="flex items-center gap-4">
              <input
                id="isListed"
                type="checkbox"
                checked={isListed}
                onChange={e => setIsListed(e.target.checked)}
                className="w-5 h-5 accent-cyan-600 border-2 border-cyan-400 rounded focus:ring-cyan-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{isListed ? 'Listed' : 'Not Listed'}</span>
            </div>
            {isListed && (
              <div className="flex flex-col gap-2 mt-2">
                <Label htmlFor="priceEth" className="text-sm text-cyan-700 dark:text-cyan-300">Price (ETH)</Label>
                <input
                  id="priceEth"
                  type="number"
                  min={0}
                  step={0.0001}
                  value={priceEth}
                  onChange={e => setPriceEth(e.target.value)}
                  placeholder="Enter price in ETH"
                  className="border border-cyan-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-cyan-400 bg-background text-foreground shadow-sm"
                  style={{ maxWidth: 180 }}
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">Set the listing price for this NFT.</span>
              </div>
            )}
            {isListed && listing && listing[0] !== '0x0000000000000000000000000000000000000000' && (
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-xs text-green-600">Currently listed for {listing[1] ? `${Number(listing[1]) / 1e18} ETH` : '-'} by {listing[0].slice(0, 6)}...{listing[0].slice(-4)}</span>
                <Button type="button" variant="destructive" size="sm" onClick={handleCancelListing} disabled={isCanceling} className="w-fit mt-1">{isCanceling ? 'Cancelling...' : 'Cancel Listing'}</Button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 border-b pb-6">
            <Label className="text-base font-semibold text-cyan-700 dark:text-cyan-300">Token URI</Label>
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono break-all select-all border rounded-md px-3 py-2 bg-muted text-foreground">{token.tokenUri}</div>
              {ipfsUrl && (
                <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline text-xs ml-2">IPFS</a>
              )}
            </div>
          </div>
          {cover && (
            <div className="flex flex-col gap-2 border-b pb-6">
              <Label className="text-base font-semibold text-cyan-700 dark:text-cyan-300">Cover</Label>
              <Tooltip.TooltipProvider>
                <Tooltip.Tooltip>
                  <Tooltip.TooltipTrigger asChild>
                    <span className="text-xs underline text-cyan-600 cursor-pointer">Hover to preview</span>
                  </Tooltip.TooltipTrigger>
                  <Tooltip.TooltipContent sideOffset={8}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt="Cover Preview" className="max-h-40 max-w-xs rounded-md border" />
                  </Tooltip.TooltipContent>
                </Tooltip.Tooltip>
              </Tooltip.TooltipProvider>
            </div>
          )}
          {media && (
            <div className="flex flex-col gap-2 border-b pb-6">
              <Label className="text-base font-semibold text-cyan-700 dark:text-cyan-300">Media</Label>
              <Tooltip.TooltipProvider>
                <Tooltip.Tooltip>
                  <Tooltip.TooltipTrigger asChild>
                    <span className="text-xs underline text-cyan-600 cursor-pointer">Hover to preview</span>
                  </Tooltip.TooltipTrigger>
                  <Tooltip.TooltipContent sideOffset={8}>
                    {media.endsWith('.mp3') || media.endsWith('.wav') ? (
                      <audio src={media} controls className="max-w-xs" />
                    ) : media.endsWith('.mp4') || media.endsWith('.webm') ? (
                      <video src={media} controls className="max-h-40 max-w-xs rounded-md border" />
                    ) : (
                      <span>Unsupported media</span>
                    )}
                  </Tooltip.TooltipContent>
                </Tooltip.Tooltip>
              </Tooltip.TooltipProvider>
            </div>
          )}
          <Button
            type="submit"
            disabled={updateNFTMutation.isPending || isRoyaltyPending || !isChanged}
            className="mt-4 bg-linear-to-r from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {updateNFTMutation.isPending || isRoyaltyPending ? "Updating..." : "Update NFT"}
          </Button>
        </form>
        <div className="w-full px-8 pb-8 flex flex-col gap-3">
          <Button
            onClick={handleStartAuction}
            disabled={!!auction}
            variant="secondary"
            className="w-full border-cyan-600 text-cyan-700 dark:text-cyan-400 font-semibold py-3 rounded-xl shadow"
          >
            {auction ? "Auction Already Started" : "Start Auction"}
          </Button>
          {success && <div className="mt-2 text-cyan-600 text-center font-semibold text-base">{success}</div>}
        </div>
      </Card>
    </div>
  );
}
