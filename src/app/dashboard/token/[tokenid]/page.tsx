"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";

import Link from "next/link";
import type { NFTModel as PrismaNFT, AuctionModel, NFTLikeModel, UserModel } from "@/generated/prisma/models";
import { getNFTByTokenId } from "@/actions/nft";
import { getAuctionByNFT } from "@/actions/auction";
import { getNFTLikesByNFT } from "@/actions/nft-likes";
import { getUserById } from "@/actions/users";
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";



export default function TokenDetailsPage() {
  const params = useParams();
  const { tokenid } = params;
  const { address } = useAccount();
  const [token, setToken] = useState<PrismaNFT | null>(null);
  const [auction, setAuction] = useState<AuctionModel | null>(null);
  const [likes, setLikes] = useState<NFTLikeModel[]>([]);
  const [creator, setCreator] = useState<UserModel | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tokenJson, setTokenJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tokenid) return;
    setLoading(true);
    (async () => {
      try {
        const nft = await getNFTByTokenId(Number(tokenid));
        if (!nft) throw new Error("Token not found");
        setToken(nft);
        setError("");
        // Fetch auction, likes, creator, tokenUri JSON
        const [auctionRes, likesRes, creatorRes] = await Promise.all([
          getAuctionByNFT(nft.id),
          getNFTLikesByNFT(nft.id),
          getUserById(nft.creatorId),
        ]);
        setAuction(auctionRes);
        setLikes(likesRes);
        setCreator(creatorRes);
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
      } catch (err) {
        setError("Token not found or error fetching data.");
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenid]);


  if (loading) return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <span className="text-muted-foreground">Loading...</span>
    </div>
  );
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!token) return <div className="p-8 text-center text-muted-foreground">No token data available.</div>;

  // Get identifier from tokenJson (name field)
  const identifier = tokenJson?.name || "-";

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-background">
      <Card className="w-full max-w-2xl border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-2xl font-semibold">{identifier}</CardTitle>
            <CardDescription className="text-xs mt-1 text-muted-foreground">Token #{token.tokenId}</CardDescription>
          </div>
          <CardAction>
            <Link href={`/dashboard/token/${token.tokenId}/edit`}>
              <Button size="sm" variant="outline">Edit</Button>
            </Link>
          </CardAction>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-muted-foreground">Royalty</Label>
              <div className="font-medium">{token.royaltyBps} bps</div>
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
              <div className="text-xs font-mono break-all select-all">{token.tokenUri || "-"}</div>
            </div>
          </div>
        </div>
        {tokenJson && (
          <div className="px-6 pb-6">
            <Label className="text-muted-foreground mb-1">Token Metadata</Label>
            <pre className="overflow-x-auto text-xs bg-muted rounded-md border p-3 mt-1 text-foreground whitespace-pre-wrap">
              {JSON.stringify(tokenJson, null, 2)}
            </pre>
          </div>
        )}
        <div className="px-6 pb-4 pt-2 flex flex-col gap-1 text-xs text-muted-foreground">
          <div>Created: {token.createdAt ? new Date(token.createdAt).toLocaleString() : "-"}</div>
          <div>Updated: {token.updatedAt ? new Date(token.updatedAt).toLocaleString() : "-"}</div>
        </div>
      </Card>
    </div>
  );
}
