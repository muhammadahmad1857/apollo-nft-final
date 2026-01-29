'use client'



import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNFT, useAuction, useUpdateNFT } from "@/hooks/useNft";
import { toast } from "sonner";
import * as Tooltip from "@/components/ui/tooltip";



export default function EditRoyaltyPage() {
  const params = useParams();
  const { tokenid } = params;
  useAccount();
  const { data: token, isLoading: loading, error: nftError } = useNFT(tokenid ? Number(tokenid) : undefined);
  const { data: auction } = useAuction(token?.id);
  const updateNFTMutation = useUpdateNFT();
  const [royalty, setRoyalty] = useState<number>(500);
  const [isListed, setIsListed] = useState<boolean>(false);
  const [success, setSuccess] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tokenJson, setTokenJson] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    // Only set state if values are different to avoid cascading renders
    setRoyalty(r => (token.royaltyBps !== undefined && token.royaltyBps !== r ? token.royaltyBps : r));
    setIsListed(l => (token.isListed !== undefined && token.isListed !== l ? token.isListed : l));
    // Fetch tokenUri JSON (IPFS)
    if (token.tokenUri && token.tokenUri.startsWith("ipfs://")) {
      const url = `https://ipfs.io/ipfs/${token.tokenUri.replace("ipfs://", "")}`;
      fetch(url)
        .then(res => res.ok ? res.json() : null)
        .then(json => setTokenJson(json))
        .catch(() => setTokenJson(null));
    } else {
      setTokenJson(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.tokenUri]);

  const handleSubmit = (e: React.FormEvent) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          toast.error("Failed to update NFT", { description: err?.message || undefined, style: { background: '#e11d48', color: '#fff' } });
        }
      }
    );
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
  const pinataImage = tokenJson?.image || null;
  const ipfsUrl = token?.tokenUri?.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${token.tokenUri.replace("ipfs://", "")}` : null;
  const cover = tokenJson?.cover as string | undefined;
  const media = tokenJson?.media as string | undefined;

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-background">
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
            <Label htmlFor="isListed">Listed</Label>
            <Switch id="isListed" checked={isListed} onCheckedChange={setIsListed} />
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
