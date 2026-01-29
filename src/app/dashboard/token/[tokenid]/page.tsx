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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500 dark:text-red-400">{error}</div>;
  if (!token) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">No token data available.</div>;

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-purple-100 dark:from-[#181c2b] dark:to-[#2a183a]">
      <div className="w-full max-w-2xl p-8 bg-white/80 dark:bg-[#181c2b]/80 rounded-3xl shadow-2xl border border-blue-100 dark:border-purple-900 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-purple-400/20 rounded-full blur-2xl animate-pulse z-0" />
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h1 className="text-4xl font-extrabold text-blue-700 dark:text-purple-200 tracking-tight drop-shadow-lg flex items-center gap-3">
            Token #{token.tokenId}
            {token.isListed && <span className="ml-2 px-3 py-1 bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 rounded-full text-xs font-bold animate-bounce">LISTED</span>}
          </h1>
          <Link href={`/dashboard/token/${token.tokenId}/edit`}>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-purple-700 dark:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400">Edit</button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/40 rounded-xl p-5 shadow-inner flex flex-col gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-300">Token ID</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-200">{token.tokenId}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/40 rounded-xl p-5 shadow-inner flex flex-col gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-300">Royalty</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-200">{token.royaltyBps} bps</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/40 rounded-xl p-5 shadow-inner flex flex-col gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-300">Mint Price</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-200">{token.mintPrice ? `${token.mintPrice} APOLLO` : "-"}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/40 rounded-xl p-5 shadow-inner flex flex-col gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-300">Likes</div>
              <div className="flex items-center gap-2">
                <span className="text-pink-500 dark:text-pink-300 text-xl">♥</span>
                <span className="font-bold text-blue-900 dark:text-blue-200">{likes.length}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/40 rounded-xl p-5 shadow-inner flex flex-col gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-300">Creator</div>
              {creator ? (
                <div className="flex items-center gap-3 mt-1">
                  {creator.avatarUrl && <img src={creator.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full border-2 border-blue-300 dark:border-purple-400 shadow" />}
                  <div>
                    <div className="font-bold text-blue-900 dark:text-blue-200">{creator.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-300 font-mono">{creator.walletAddress}</div>
                  </div>
                </div>
              ) : <span className="italic text-gray-400">-</span>}
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/40 rounded-xl p-5 shadow-inner flex flex-col gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-300">Auction</div>
              {auction ? (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="font-bold text-blue-900 dark:text-blue-200">Min Bid: {auction.minBid} APOLLO</div>
                  <div className="text-xs text-gray-400 dark:text-gray-300">Status: {auction.settled ? "Settled" : "Active"}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-300">Ends: {new Date(auction.endTime).toLocaleString()}</div>
                </div>
              ) : <span className="italic text-gray-400">No auction</span>}
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/40 rounded-xl p-5 shadow-inner flex flex-col gap-1">
              <div className="text-xs text-gray-500 dark:text-gray-300">Token URI</div>
              <div className="text-xs font-mono text-blue-900 dark:text-blue-200 break-all">{token.tokenUri || "-"}</div>
            </div>
          </div>
        </div>
        {/* TokenURI JSON Preview */}
        {tokenJson && (
          <div className="mt-10 bg-gradient-to-br from-blue-100/80 to-purple-100/80 dark:from-blue-900/40 dark:to-purple-900/40 rounded-2xl p-6 shadow-inner border border-blue-200 dark:border-purple-800">
            <div className="text-lg font-bold text-blue-700 dark:text-purple-200 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">description</span> Token Metadata Preview
            </div>
            <pre className="overflow-x-auto text-xs md:text-sm text-gray-800 dark:text-gray-200 bg-transparent p-0 m-0 whitespace-pre-wrap">
              {JSON.stringify(tokenJson, null, 2)}
            </pre>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-2 text-xs text-gray-400 dark:text-gray-500">
          <div>Created: {token.createdAt ? new Date(token.createdAt).toLocaleString() : "-"}</div>
          <div>Updated: {token.updatedAt ? new Date(token.updatedAt).toLocaleString() : "-"}</div>
        </div>
      </div>
    </div>
  );
}
