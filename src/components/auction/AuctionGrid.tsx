import AuctionCard from "./AuctionCard";

export default function AuctionGrid({ auctions }: { auctions: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-4 pb-16">
      {auctions.map((data) => (
        <AuctionCard key={data.auction.id} {...data} />
      ))}
    </div>
  );
}
