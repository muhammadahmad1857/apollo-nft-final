import { getActiveAuctions } from "@/actions/auction";
import AuctionFilters from "@/components/auction/AuctionFilters";
import AuctionGrid from "@/components/auction/AuctionGrid";

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    min?: string;
    max?: string;
    endingSoon?: string;
  };
}) {
  const auctions = await getActiveAuctions({
    search: searchParams.q,
    minPrice: searchParams.min ? Number(searchParams.min) : undefined,
    maxPrice: searchParams.max ? Number(searchParams.max) : undefined,
    endingSoon: searchParams.endingSoon === "true",
  });
  console.log(auctions)

  return (
    <div className="container mx-auto py-20 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Auctions</h1>
        <p className="text-muted-foreground">Browse all active NFT auctions</p>
      </div>

      <AuctionFilters />
      <AuctionGrid auctions={auctions} />
    </div>
  );
}
