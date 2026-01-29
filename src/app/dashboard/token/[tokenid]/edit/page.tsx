'use client'


import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import type { NFTModel as PrismaNFT, NFTUpdateInput, AuctionModel } from "@/generated/prisma/models";
import { getNFTByTokenId, updateNFT } from "@/actions/nft";
import { getAuctionByNFT } from "@/actions/auction";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";



export default function EditRoyaltyPage() {
  const params = useParams();
  const { tokenid } = params;
  const { address } = useAccount();
  const [royalty, setRoyalty] = useState<number | null>(null);
  const [isListed, setIsListed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState<PrismaNFT | null>(null);
  const [auction, setAuction] = useState<AuctionModel | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tokenJson, setTokenJson] = useState<any>(null);

  useEffect(() => {
    if (!tokenid) return;
    setLoading(true);
    (async () => {
      try {
        const nft = await getNFTByTokenId(Number(tokenid));
        setToken(nft);
        setRoyalty(nft?.royaltyBps ?? 0);
        setIsListed(nft?.isListed ?? false);
        setError("");
        if (nft) {
          setAuction(await getAuctionByNFT(nft.id));
          // Fetch tokenUri JSON (IPFS)
          if (nft.tokenUri && nft.tokenUri.startsWith("ipfs://")) {
            const url = `https://ipfs.io/ipfs/${nft.tokenUri.replace("ipfs://", "")}`;
            try {
              const res = await fetch(url);
              if (res.ok) {
                setTokenJson(await res.json());
              } else {
                setTokenJson(null);
              }
            } catch {
              setTokenJson(null);
            }
          } else {
            setTokenJson(null);
          }
        }
      } catch {
        setError("Failed to fetch token details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (!token || royalty === null) throw new Error("No token loaded");
      const data: NFTUpdateInput = { royaltyBps: royalty, isListed };
      await updateNFT(token.id, data);
      setSuccess("NFT updated successfully.");
    } catch (err) {
      setError("Failed to update NFT.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = () => {
    // TODO: Implement start auction modal/flow
    alert("Start Auction modal coming soon!");
  };


  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><span className="text-muted-foreground">Loading...</span></div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!token) return null;

  // Get identifier from tokenJson (name field)
  const identifier = tokenJson?.name || "-";

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-background">
      <Card className="w-full max-w-lg border shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-2xl font-semibold">Edit {identifier}</CardTitle>
          <CardDescription className="text-xs mt-1 text-muted-foreground">Token #{token.tokenId}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="royalty">Royalty (bps)</Label>
            <Input
              id="royalty"
              type="number"
              value={royalty ?? ""}
              min={0}
              max={1000}
              onChange={e => setRoyalty(Number(e.target.value))}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="isListed">Listed</Label>
            <Switch id="isListed" checked={isListed} onCheckedChange={setIsListed} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Token URI</Label>
            <div className="text-xs font-mono break-all select-all border rounded-md px-3 py-2 bg-muted text-foreground">{token.tokenUri}</div>
          </div>
          <Button type="submit" disabled={loading} className="mt-2">Update NFT</Button>
        </form>
        <div className="px-6 pb-6">
          <Button onClick={handleStartAuction} disabled={!!auction} variant="secondary" className="w-full">
            {auction ? "Auction Already Started" : "Start Auction"}
          </Button>
          {success && <div className="mt-2 text-green-600 text-center font-semibold">{success}</div>}
        </div>
      </Card>
    </div>
  );
}
