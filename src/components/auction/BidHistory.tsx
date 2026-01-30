import { getBidsByAuctionWithUser } from "@/actions/bid";
import { BidModel, UserModel } from "@/generated/prisma/models";

export default async function BidHistory({ auctionId }: { auctionId: number }) {
    // Fetch bids for the given tokenId
    const bids = await getBidsByAuctionWithUser(auctionId)
  return (
    <table className="w-full text-left bg-gray-900 rounded-xl overflow-hidden">
      <thead>
        <tr className="bg-gray-800">
          <th className="px-4 py-2">Bidder</th>
          <th className="px-4 py-2">Amount</th>
          <th className="px-4 py-2">Time</th>
        </tr>
      </thead>
      <tbody>
        {bids.map(bid => (
          <tr key={bid.id} className="border-b border-gray-800">
            <td className="px-4 py-2 flex items-center gap-2">
              <img src={bid.bidder?.avatarUrl||""} className="w-6 h-6 rounded-full" />
              <span>{bid.bidder?.name}</span>
            </td>
            <td className="px-4 py-2 font-bold">{bid.amount} ETH</td>
            <td className="px-4 py-2 text-sm text-gray-400">{new Date(bid.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
