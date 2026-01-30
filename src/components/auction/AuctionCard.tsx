import Link from "next/link";
import { useAccount } from "wagmi";
import { useAuction } from "@/hooks/useAuction";
import CountdownTimer from "./CountdownTimer";

interface AuctionCardProps {
  auction: {
    id: number;
    tokenId: number;
    highestBid?: number;
    minBid: number;
    endTime: string;
  };
  nft?: {
    imageUrl?: string;
    title?: string;
  };
  seller?: {
    avatarUrl?: string;
    name?: string;
  };
  highestBidder?: {
    avatarUrl?: string;
    name?: string;
  };
}

export default function AuctionCard({ auction, nft, seller, highestBidder }: AuctionCardProps) {
  const { isConnected } = useAccount();
  const { bid, isBusy, handleToasts } = useAuction();

  // Call handleToasts in effect (not shown here)

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all relative overflow-hidden">
      <Link href={`/auction/${auction.tokenId}`} className="block">
        <img src={nft?.imageUrl} alt={nft?.title} className="w-full h-64 object-cover rounded-t-xl" />
        <div className="p-4">
          <h2 className="text-xl font-bold mb-1">{nft?.title}</h2>
          <div className="flex items-center gap-2 mb-2">
            <img src={seller?.avatarUrl} className="w-8 h-8 rounded-full" />
            <span className="font-medium">{seller?.name}</span>
          </div>
          <div className="mb-2">
            <span className="text-sm text-gray-400">Highest Bid:</span>
            <span className="ml-2 font-bold text-lg">{auction.highestBid ? `${auction.highestBid} ETH` : `${auction.minBid} ETH`}</span>
          </div>
          <CountdownTimer endTime={auction.endTime} />
        </div>
      </Link>
      {isConnected && (
        <button
          className="absolute bottom-4 right-4 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all opacity-0 group-hover:opacity-100"
          disabled={isBusy}
          onClick={() => bid({ tokenId: auction.tokenId, amount: BigInt(Math.floor((auction.highestBid ? auction.highestBid + 0.01 : auction.minBid) * 1e18)) })}
        >
          Place Bid
        </button>
      )}
    </div>
  );
}
