"use client"
import Link from "next/link";
import { useAccount } from "wagmi";
import { useAuction } from "@/hooks/useAuction";
import CountdownTimer from "./CountdownTimer";
import { ActiveAuctions } from "@/app/auction/page";



export default function AuctionCard(data: ActiveAuctions) {
  const { isConnected } = useAccount();
  const { bid, isBusy, handleToasts } = useAuction();

  // Call handleToasts in effect (not shown here)

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all relative overflow-hidden">
      <Link href={`/auction/${data.nft.tokenId}`} className="block">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-1">{data.nft?.title}</h2>
          <div className="flex items-center gap-2 mb-2">
            <img src={data.seller?.avatarUrl||""} className="w-8 h-8 rounded-full" />
            <span className="font-medium">{data.seller?.name}</span>
          </div>
          <div className="mb-2">
            <span className="text-sm text-gray-400">Highest Bid:</span>
            <span className="ml-2 font-bold text-lg">{data.highestBid ? `${data.highestBid} ETH` : `${data.minBid} ETH`}</span>
          </div>
          <CountdownTimer endTime={data.endTime.toISOString()} />
        </div>
      </Link>
      {isConnected && (
        <button
          className="absolute bottom-4 right-4 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all opacity-0 group-hover:opacity-100"
          disabled={isBusy}
          onClick={() => bid({ tokenId: data.nft.tokenId, amount: BigInt(Math.floor((data.highestBid ? data.highestBid + 0.01 : data.minBid) * 1e18)) })}
        >
          Place Bid
        </button>
      )}
    </div>
  );
}
