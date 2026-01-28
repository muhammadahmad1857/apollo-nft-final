
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import type { NFTModel as PrismaNFT } from "@/generated/prisma/models";
import { getNFTById } from "@/actions/nft";


export default function TokenDetailsPage() {
  const params = useParams  ();
  const { tokenid } = params;
  const { address } = useAccount();
  const [token, setToken] = useState<PrismaNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tokenid) return;
    setLoading(true);
    getNFTById(Number(tokenid))
      .then((nft) => {
        setToken(nft);
        setError("");
      })
      .catch(() => {
        setError("Token not found or error fetching data.");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [tokenid]);

  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!token) return null;

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="w-full max-w-xl p-8 bg-white rounded-3xl shadow-2xl border border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">Token #{token.tokenId}</h1>
          <Link href={`/dashboard/token/${token.tokenId}/edit`}>
            <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow hover:scale-105 transition">Edit</button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <div className="bg-blue-50 rounded-xl p-4 shadow-inner">
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-lg font-bold text-blue-900">{token.name || "-"}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 shadow-inner">
              <div className="text-xs text-gray-500">Owner</div>
              <div className="text-lg font-mono text-blue-900 break-all">{token.ownerId}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 shadow-inner">
              <div className="text-xs text-gray-500">Royalty</div>
              <div className="text-lg font-bold text-blue-900">{token.royaltyBps} bps</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-purple-50 rounded-xl p-4 shadow-inner">
              <div className="text-xs text-gray-500">Status</div>
              <div className={token.isListed ? "text-green-600 font-bold" : "text-gray-400 font-bold"}>
                {token.isListed ? "Listed" : "Not Listed"}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 shadow-inner">
              <div className="text-xs text-gray-500">Mint Price</div>
              <div className="text-lg font-bold text-blue-900">{token.mintPrice ? `${token.mintPrice} APOLLO` : "-"}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 shadow-inner">
              <div className="text-xs text-gray-500">Token URI</div>
              <div className="text-xs font-mono text-blue-900 break-all">{token.tokenUri || "-"}</div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2">
          <div className="text-xs text-gray-400">Created: {token.createdAt ? new Date(token.createdAt).toLocaleString() : "-"}</div>
          <div className="text-xs text-gray-400">Updated: {token.updatedAt ? new Date(token.updatedAt).toLocaleString() : "-"}</div>
        </div>
      </div>
    </div>
  );
}
