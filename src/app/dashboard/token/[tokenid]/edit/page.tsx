'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import type { NFTModel as PrismaNFT, NFTUpdateInput, AuctionModel } from "@/generated/prisma/models";
import { getNFTByTokenId, updateNFT } from "@/actions/nft";
import Link from "next/link";
import { getAuctionByNFT } from "@/actions/auction";



export default function EditRoyaltyPage() {
  const params = useParams();
  const { tokenid } = params;
  const { address } = useAccount();
  const [royalty, setRoyalty] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState<PrismaNFT | null>(null);
  const [auction, setAuction] = useState<AuctionModel | null>(null);

  useEffect(() => {
    if (!tokenid) return;
    setLoading(true);
    (async () => {
      try {
        const nft = await getNFTByTokenId(Number(tokenid));
        setToken(nft);
        setRoyalty(nft?.royaltyBps ?? 0);
        setError("");
        if (nft) {
          setAuction(await getAuctionByNFT(nft.id));
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
      const data: NFTUpdateInput = { royaltyBps: royalty };
      await updateNFT(token.id, data);
      setSuccess("Royalty updated successfully.");
    } catch (err) {
      setError("Failed to update royalty.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = () => {
    // TODO: Implement start auction modal/flow
    alert("Start Auction modal coming soon!");
  };

  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div></div>;
  if (error) return <div className="p-8 text-center text-red-500 dark:text-red-400">{error}</div>;
  if (!token) return null;

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-purple-100 dark:from-[#181c2b] dark:to-[#2a183a]">
      <div className="w-full max-w-lg p-8 bg-white/80 dark:bg-[#181c2b]/80 rounded-3xl shadow-2xl border border-blue-100 dark:border-purple-900 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-purple-400/20 rounded-full blur-2xl animate-pulse z-0" />
        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-purple-200 mb-8 tracking-tight drop-shadow-lg relative z-10 flex items-center gap-3">
          Edit NFT #{token.tokenId}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 relative z-10">
          <div className="bg-blue-50 dark:bg-blue-900/40 rounded-xl p-6 shadow-inner flex flex-col gap-2">
            <label className="text-sm font-semibold text-blue-700 dark:text-blue-200">Royalty (bps)</label>
            <input
              type="number"
              className="w-full p-3 border-2 border-blue-200 dark:border-purple-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-purple-400 text-lg font-mono bg-white dark:bg-[#181c2b] text-blue-900 dark:text-blue-200"
              value={royalty ?? ""}
              min={0}
              max={1000}
              onChange={(e) => setRoyalty(Number(e.target.value))}
              required
            />
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/40 rounded-xl p-6 shadow-inner flex flex-col gap-2">
            <label className="text-sm font-semibold text-purple-700 dark:text-purple-200">Token URI</label>
            <div className="w-full p-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl text-xs font-mono bg-white dark:bg-[#181c2b] text-blue-900 dark:text-blue-200 break-all select-all">
              {token.tokenUri}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-purple-700 dark:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          >
            Update Royalty
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-4 relative z-10">
          <button
            onClick={handleStartAuction}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-yellow-500 dark:from-pink-700 dark:to-yellow-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-lg tracking-wide animate-pulse"
            disabled={!!auction}
          >
            {auction ? "Auction Already Started" : "Start Auction"}
          </button>
          {success && <div className="mt-2 text-green-600 dark:text-green-400 text-center font-semibold animate-fade-in">{success}</div>}
        </div>
      </div>
    </div>
  );
}
