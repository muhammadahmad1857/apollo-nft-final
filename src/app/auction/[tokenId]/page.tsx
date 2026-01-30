import AuctionDetail from "@/components/auction/AuctionDetail";
import { getAuctionByNFT } from "@/actions/auction";
import { getNFTById } from "@/actions/nft";
import { getUserById } from "@/actions/users";
import { getBidsByAuction } from "@/actions/bid";

export default async function AuctionTokenPage({ params }: { params: { tokenId: string } }) {
  const tokenId = Number(params.tokenId);
  const auctionRaw = await getAuctionByNFT(tokenId);
  if (!auctionRaw) return <div className="text-center py-20">Auction not found</div>;
  const nftRaw = await getNFTById(auctionRaw.nftId);
  const sellerRaw = await getUserById(auctionRaw.sellerId);
  const highestBidderRaw = auctionRaw.highestBidderId ? await getUserById(auctionRaw.highestBidderId) : undefined;
  const bids = await getBidsByAuction(auctionRaw.id);

  // Transform auction to expected props
  const auction = {
    tokenId: tokenId,
    highestBid: auctionRaw.highestBid ?? undefined,
    minBid: auctionRaw.minBid,
    endTime: auctionRaw.endTime instanceof Date ? auctionRaw.endTime.toISOString() : String(auctionRaw.endTime),
    sellerAddress: sellerRaw?.walletAddress ?? "",
    settled: auctionRaw.settled,
  };
  const nft = nftRaw
    ? {
        imageUrl: nftRaw.tokenUri, // or nftRaw.imageUrl if available
        title: nftRaw.title,
        description: nftRaw.description,
      }
    : undefined;
  const seller = sellerRaw
    ? {
        avatarUrl: sellerRaw.avatarUrl ?? undefined,
        name: sellerRaw.name,
      }
    : undefined;
  const highestBidder = highestBidderRaw
    ? {
        avatarUrl: highestBidderRaw.avatarUrl ?? undefined,
        name: highestBidderRaw.name,
      }
    : undefined;

  return (
    <AuctionDetail
      auction={auction}
      nft={nft}
      seller={seller}
      highestBidder={highestBidder}
      bids={bids}
    />
  );
}
