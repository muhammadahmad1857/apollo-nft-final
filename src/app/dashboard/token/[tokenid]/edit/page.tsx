


import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNFT, useAuction, useUpdateNFT } from "@/hooks/useNft";
import { useListNFT, useCancelListing, useListing } from "@/hooks/useMarketplace";
import { toast } from "sonner";
import * as Tooltip from "@/components/ui/tooltip";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PinataJSON } from "@/types";

export default function EditRoyaltyPage() {
  const params = useParams();
  const { tokenid } = params;
  const { address } = useAccount();
  const { data: token, isLoading: loading, error: nftError } = useNFT(tokenid ? Number(Array.isArray(tokenid) ? tokenid[0] : tokenid) : undefined);
  const { data: auction } = useAuction(token?.id);
  const updateNFTMutation = useUpdateNFT();
  const [royalty, setRoyalty] = useState(500);
  const [isListed, setIsListed] = useState(false);
  const [success, setSuccess] = useState("");
  const [priceEth, setPriceEth] = useState("");
  const [tokenJson, setTokenJson] = useState<PinataJSON|null>(null);

  // Marketplace hooks
  const { listNFT, isPending: isListing } = useListNFT();
  const { cancelListing, isPending: isCanceling } = useCancelListing();
  const tokenIdStr = Array.isArray(tokenid) ? tokenid[0] : tokenid;
  const { data: listing, refetch: refetchListing, isLoading: isListingLoading } = useListing(tokenIdStr ? BigInt(tokenIdStr) : BigInt(0)) as {
    data: [string, string] | undefined;
    refetch: () => void;
    isLoading: boolean;
  };

  useEffect(() => {
    if (!token) return;
    setRoyalty(r => (token.royaltyBps !== undefined && token.royaltyBps !== r ? token.royaltyBps : r));
    setIsListed(l => (token.isListed !== undefined && token.isListed !== l ? token.isListed : l));
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess("");
    if (!token) return;
    updateNFTMutation.mutate(
      { id: token.id, data: { royaltyBps: royalty, isListed } },
      {
        onSuccess: () => {
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

  // List NFT on marketplace
  const handleListNFT = async () => {
    if (!tokenid || !priceEth) return toast.error("Enter price to list");
    try {
      await listNFT(BigInt(tokenIdStr ? BigInt(tokenIdStr) : BigInt(0)), priceEth);
      toast.success("NFT listed on marketplace!", { style: { background: '#06b6d4', color: '#fff' } });
      refetchListing();
    } catch (err) {
      const error = err as { message?: string };
      toast.error("Failed to list NFT", { description: error?.message || undefined, style: { background: '#e11d48', color: '#fff' } });
    }
  };

  // Cancel NFT listing
  const handleCancelListing = async () => {
    if (!tokenid) return;
    try {
      await cancelListing(BigInt(tokenIdStr ? BigInt(tokenIdStr) : BigInt(0)));
      toast.success("Listing cancelled!", { style: { background: '#06b6d4', color: '#fff' } });
      refetchListing();
    } catch (err) {
      const error = err as { message?: string };
      toast.error("Failed to cancel listing", { description: error?.message || undefined, style: { background: '#e11d48', color: '#fff' } });
    }
  };

  const handleStartAuction = () => {
    // TODO: Implement start auction modal/flow
    alert("Start Auction modal coming soon!");
  };


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
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full px-6 py-6">
          <div className="flex flex-col gap-2 border-b pb-4">
            <Label htmlFor="royalty">Royalty (bps)</Label>
            <div className="flex items-center gap-3">
              <input
                id="royalty"
                type="range"
                min={0}
                max={1000}
                step={10}
                value={royalty}
                onChange={e => setRoyalty(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                style={{ boxShadow: '0 0 0 2px #06b6d4' }}
              />
              <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">{royalty} bps</span>
              <span className="font-semibold text-cyan-600 dark:text-cyan-300">{(royalty / 100).toFixed(2)}%</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Set the royalty for secondary sales (0-10%).</span>
          </div>
          <div className="flex flex-col gap-2 border-b pb-4">
            <Label htmlFor="isListed">Listing Status</Label>
            {isListingLoading ? (
              <span className="text-xs text-muted-foreground">Loading listing...</span>
            ) : listing && listing[0] !== '0x0000000000000000000000000000000000000000' ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-green-600">Listed for {listing[1] ? `${Number(listing[1]) / 1e18} ETH` : '-'} by {listing[0].slice(0, 6)}...{listing[0].slice(-4)}</span>
                <Button type="button" variant="destructive" size="sm" onClick={handleCancelListing} disabled={isCanceling} className="w-fit mt-1">{isCanceling ? 'Cancelling...' : 'Cancel Listing'}</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Price in ETH"
                    value={priceEth}
                    onChange={e => setPriceEth(e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-32 focus:ring-2 focus:ring-cyan-400"
                  />
                  <Button type="button" size="sm" onClick={handleListNFT} disabled={isListing} className="bg-cyan-600 hover:bg-cyan-700 text-white w-fit">{isListing ? 'Listing...' : 'List NFT'}</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 border-b pb-4">
            <Label>Token URI</Label>
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono break-all select-all border rounded-md px-3 py-2 bg-muted text-foreground">{token.tokenUri}</div>
              {ipfsUrl && (
                <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline text-xs ml-2">IPFS</a>
              )}
            </div>
          </div>
          {cover && (
            <div className="flex flex-col gap-2 border-b pb-4">
              <Label>Cover</Label>
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
            <div className="flex flex-col gap-2 border-b pb-4">
              <Label>Media</Label>
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
          <Button type="submit" disabled={updateNFTMutation.isPending} className="mt-2 bg-cyan-600 hover:bg-cyan-700 text-white">
            {updateNFTMutation.isPending ? "Updating..." : "Update NFT"}
          </Button>
        </form>
        <div className="w-full px-6 pb-6 flex flex-col gap-2">
          <Button onClick={handleStartAuction} disabled={!!auction} variant="secondary" className="w-full border-cyan-600 text-cyan-700 dark:text-cyan-400">
            {auction ? "Auction Already Started" : "Start Auction"}
          </Button>
          {success && <div className="mt-2 text-cyan-600 text-center font-semibold">{success}</div>}
        </div>
      </Card>
    </div>
  );
}
