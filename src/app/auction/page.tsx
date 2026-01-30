import AuctionGrid from "@/components/auction/AuctionGrid";
import AuctionFilters from "@/components/auction/AuctionFilters";
import CreateAuctionButton from "@/components/auction/CreateAuctionButton";
import { getActiveAuctions } from "@/actions/auction";
import { getNFTById } from "@/actions/nft";
import { getUserById } from "@/actions/users";

export default async function AuctionPage() {
  const auctions = await getActiveAuctions();
  // Fetch related NFT, seller, highest bidder for each auction
  const auctionCards = await Promise.all(
    auctions.map(async (auction) => {
      const nft = await getNFTById(auction.nftId);
      const seller = await getUserById(auction.sellerId);
      const highestBidder = auction.highestBidderId ? await getUserById(auction.highestBidderId) : null;
      return { auction, nft, seller, highestBidder };
    })
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <section className="py-10 text-center">
        <h1 className="text-4xl font-bold mb-2">🔥 Live NFT Auctions</h1>
        <p className="text-lg mb-6">Bid on exclusive music NFTs in real time</p>
        <div className="flex justify-center gap-4 mb-6">
          <AuctionFilters />
          <CreateAuctionButton />
        </div>
      </section>
      <AuctionGrid auctions={auctionCards} />
    </main>
  );
}
