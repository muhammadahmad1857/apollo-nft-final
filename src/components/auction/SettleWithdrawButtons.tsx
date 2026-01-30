"use client"
import { useAccount } from "wagmi";
import { useAuction } from "@/hooks/useAuction";

interface AuctionProps {
  auction: {
    tokenId: number;
    endTime: string;
    sellerAddress: string;
    settled: boolean;
  };
}

export default function SettleWithdrawButtons({ auction }: AuctionProps) {
  const { address } = useAccount();
  const { settle, withdraw, isBusy, handleToasts } = useAuction();
  const now = Date.now();
  const ended = new Date(auction.endTime).getTime() < now;
  const isSeller = address && address === auction.sellerAddress;

  // Call handleToasts in effect (not shown here)

  return (
    <div className="flex gap-2 mt-4">
      {ended && isSeller && !auction.settled && (
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
          disabled={isBusy}
          onClick={() => settle(auction.tokenId)}
        >
          Settle Auction
        </button>
      )}
      {isSeller && (
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
          disabled={isBusy}
          onClick={() => withdraw()}
        >
          Withdraw Funds
        </button>
      )}
    </div>
  );
}
