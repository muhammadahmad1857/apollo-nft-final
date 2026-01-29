'use client'
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import type { NFTModel as PrismaNFT, NFTUpdateInput } from "@/generated/prisma/models";
import { getNFTByTokenId, updateNFT } from "@/actions/nft";


export default function EditRoyaltyPage() {
  const params = useParams();
  const { tokenid } = params;
  const { address } = useAccount();
  const [royalty, setRoyalty] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState<PrismaNFT | null>(null);

  useEffect(() => {
    if (!tokenid) return;
    setLoading(true);
    getNFTByTokenId(Number(tokenid))
      .then((nft) => {
        setToken(nft);
        setRoyalty(nft?.royaltyBps ?? 0);
        setError("");
      })
      .catch(() => {
        setError("Failed to fetch token details.");
      })
      .finally(() => setLoading(false));
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

  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!token) return null;

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="w-full max-w-lg p-8 bg-white rounded-3xl shadow-2xl border border-blue-100">
        <h1 className="text-2xl font-extrabold text-blue-700 mb-6">Edit Royalty for Token #{token.tokenId}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-blue-50 rounded-xl p-6 shadow-inner flex flex-col gap-2">
            <label className="text-sm font-semibold text-blue-700">Royalty (bps)</label>
            <input
              type="number"
              className="w-full p-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 text-lg font-mono"
              value={royalty ?? ""}
              min={0}
              max={1000}
              onChange={(e) => setRoyalty(Number(e.target.value))}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow hover:scale-105 transition"
            disabled={loading}
          >
            Update Royalty
          </button>
        </form>
        {success && <div className="mt-4 text-green-600 text-center">{success}</div>}
      </div>
    </div>
  );
}
