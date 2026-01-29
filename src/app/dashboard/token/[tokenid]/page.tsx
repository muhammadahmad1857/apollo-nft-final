"use client"


import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNFT, useAuction } from "@/hooks/useNft";
import { useQuery } from '@tanstack/react-query';
import { getNFTLikesByNFT } from "@/actions/nft-likes";
import { getUserById } from "@/actions/users";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";


export default function TokenDetailsPage() {
  const { tokenid } = useParams();
  const { data: token, isLoading: loading, error: nftError } = useNFT(tokenid ? Number(tokenid) : undefined);
  const { data: auction } = useAuction(token?.id);
  // Likes and creator fetched with react-query for caching
  const { data: likes = [] } = useQuery({
    queryKey: ["nft-likes", token?.id],
    queryFn: () => token?.id ? getNFTLikesByNFT(token.id) : [],
    enabled: !!token?.id,
  });
  const { data: creator } = useQuery({
    queryKey: ["nft-creator", token?.creatorId],
    queryFn: () => token?.creatorId ? getUserById(token.creatorId) : null,
    enabled: !!token?.creatorId,
  });
  // TokenURI JSON preview
  const [tokenJson, setTokenJson] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!token) return;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }
  if (nftError) {
    return <div className="p-8 text-center text-destructive">{nftError.message}</div>;
  }
  if (!token) {
    return <div className="p-8 text-center text-muted-foreground">No token data available.</div>;
  }

  // Get identifier from tokenJson (name field)
  const identifier = tokenJson?.name || "-";
  const pinataImage = tokenJson?.image || null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-background py-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Block 1: NFT Main Info */}
        <Card className="border shadow-sm w-full">
          <CardHeader className="border-b pb-4 flex flex-col items-center justify-between md:flex-row md:items-center">
            <div className="w-full md:w-auto flex flex-col items-center md:items-start">
              <CardTitle className="text-3xl font-bold text-center md:text-left w-full">{String(identifier)}</CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground text-center md:text-left w-full">Token #{token.tokenId}</CardDescription>
            </div>
            <CardAction>
              <Link href={`/dashboard/token/${token.tokenId}/edit`}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
            </CardAction>
          </CardHeader>
          {pinataImage && (
            <div className="w-full flex justify-center py-6 border-b">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={String(pinataImage)} alt="Pinata Preview" className="max-h-72 rounded-md object-contain border bg-muted" style={{maxWidth:'100%'}} />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-muted-foreground">Royalty</Label>
                <div className="font-medium">{token.royaltyBps} bps ({(token.royaltyBps/100).toFixed(2)}%)</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Mint Price</Label>
                <div className="font-medium">{token.mintPrice ? `${token.mintPrice} APOLLO` : "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Likes</Label>
                <div className="font-medium">{likes.length}</div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-muted-foreground">Creator</Label>
                <div className="font-medium">{creator?.name || "-"}</div>
                <div className="text-xs text-muted-foreground">{creator?.walletAddress}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Auction</Label>
                {auction ? (
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">Min Bid: {auction.minBid} APOLLO</div>
                    <div className="text-xs text-muted-foreground">Status: {auction.settled ? "Settled" : "Active"}</div>
                    <div className="text-xs text-muted-foreground">Ends: {new Date(auction.endTime).toLocaleString()}</div>
                  </div>
                ) : <span className="text-xs text-muted-foreground">No auction</span>}
              </div>
              <div>
                <Label className="text-muted-foreground">Token URI</Label>
                <div className="text-xs font-mono break-all select-all border rounded-md px-3 py-2 bg-muted text-foreground">{token.tokenUri || "-"}</div>
              </div>
            </div>
          </div>
        </Card>
        {/* Block 2: TokenURI JSON Preview */}
        {tokenJson && (
          <Card className="border shadow-sm w-full">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-semibold">TokenURI JSON Preview</CardTitle>
            </CardHeader>
            <div className="p-6 bg-muted rounded-b-md overflow-x-auto text-xs font-mono">
              <pre>{JSON.stringify(tokenJson, null, 2)}</pre>
            </div>
          </Card>
        )}
        <div className="px-6 pb-4 pt-2 flex flex-col gap-1 text-xs text-muted-foreground">
          <div>Created: {token.createdAt ? new Date(token.createdAt).toLocaleString() : "-"}</div>
          <div>Updated: {token.updatedAt ? new Date(token.updatedAt).toLocaleString() : "-"}</div>
        </div>
      </div>
    </div>
  );
}
