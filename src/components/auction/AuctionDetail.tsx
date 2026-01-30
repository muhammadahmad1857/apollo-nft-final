import BidForm from "./BidForm";
import BidHistory from "./BidHistory";
import SettleWithdrawButtons from "./SettleWithdrawButtons";
import CountdownTimer from "./CountdownTimer";
import { ActiveAuctions } from "@/app/auction/page";



export default function AuctionDetail(data: ActiveAuctions) {
  return (
    <div className="flex flex-col md:flex-row gap-8 p-8 bg-gradient-to-br from-black to-gray-900 rounded-xl shadow-2xl">
      {/* Left: NFT image */}
      <div className="md:w-1/2 flex justify-center items-center">
      <h1 className="text-4xl font-bold ">{data.nft?.title}</h1>
      </div>
      {/* Right: Info & actions */}
      <div className="md:w-1/2 flex flex-col gap-4">
        <h1 className="text-3xl font-bold mb-2">{data.nft?.title}</h1>
        <p className="text-gray-300 mb-2">{data.nft?.description}</p>
        <div className="flex items-center gap-2 mb-2">
          <img src={data.seller?.avatarUrl || ""} className="w-8 h-8 rounded-full" />
          <span className="font-medium">Seller: {data.seller?.name}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          {data.highestBidder && <img src={data.highestBidder?.avatarUrl || ""} className="w-8 h-8 rounded-full" />}
          {data.highestBidder && <span className="font-medium">Highest Bidder: {data.highestBidder?.name}</span>}
        </div>
        <div className="mb-2">
          <span className="text-sm text-gray-400">Highest Bid:</span>
          <span className="ml-2 font-bold text-lg">{data.highestBid ? `${data.highestBid} ETH` : `${data.minBid} ETH`}</span>
        </div>
        <CountdownTimer endTime={data.endTime.toISOString()} />
        <BidForm auction={{ tokenId: data.nft.tokenId, highestBid: data.highestBid||0, minBid: data.minBid }} />
        <SettleWithdrawButtons auction={{ tokenId: data.nft.tokenId, endTime: data.endTime.toISOString(), sellerAddress: data.seller?.walletAddress || "", settled: data.settled }} />
      </div>
      {/* Bottom: Bid history */}
      <div className="w-full mt-8">
        <BidHistory auctionId={data.id} />
      </div>
    </div>
  );
}
