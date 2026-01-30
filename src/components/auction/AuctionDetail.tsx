import BidForm from "./BidForm";
import BidHistory from "./BidHistory";
import SettleWithdrawButtons from "./SettleWithdrawButtons";
import CountdownTimer from "./CountdownTimer";

interface Bid {
  id: number;
  amount: number;
  createdAt: string | Date;
  bidder?: {
    avatarUrl?: string;
    name?: string;
  };
}

interface AuctionDetailProps {
  auction: {
    tokenId: number;
    highestBid?: number;
    minBid: number;
    endTime: string;
    sellerAddress: string;
    settled: boolean;
  };
  nft?: {
    imageUrl?: string;
    title?: string;
    description?: string;
  };
  seller?: {
    avatarUrl?: string;
    name?: string;
  };
  highestBidder?: {
    avatarUrl?: string;
    name?: string;
  };
  bids: Bid[];
}

export default function AuctionDetail({ auction, nft, seller, highestBidder, bids }: AuctionDetailProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 p-8 bg-gradient-to-br from-black to-gray-900 rounded-xl shadow-2xl">
      {/* Left: NFT image */}
      <div className="md:w-1/2 flex justify-center items-center">
        <img src={nft?.imageUrl} alt={nft?.title} className="rounded-xl max-h-[500px] object-contain" />
      </div>
      {/* Right: Info & actions */}
      <div className="md:w-1/2 flex flex-col gap-4">
        <h1 className="text-3xl font-bold mb-2">{nft?.title}</h1>
        <p className="text-gray-300 mb-2">{nft?.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <img src={seller?.avatarUrl} className="w-8 h-8 rounded-full" />
          <span className="font-medium">Seller: {seller?.name}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          {highestBidder && <img src={highestBidder?.avatarUrl} className="w-8 h-8 rounded-full" />}
          {highestBidder && <span className="font-medium">Highest Bidder: {highestBidder?.name}</span>}
        </div>
        <div className="mb-2">
          <span className="text-sm text-gray-400">Highest Bid:</span>
          <span className="ml-2 font-bold text-lg">{auction.highestBid ? `${auction.highestBid} ETH` : `${auction.minBid} ETH`}</span>
        </div>
        <CountdownTimer endTime={auction.endTime} />
        <BidForm auction={auction} />
        <SettleWithdrawButtons auction={auction} />
      </div>
      {/* Bottom: Bid history */}
      <div className="w-full mt-8">
        <BidHistory bids={bids} />
      </div>
    </div>
  );
}
