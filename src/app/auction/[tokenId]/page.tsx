import AuctionDetail from "@/components/auction/AuctionDetail";
import { getAuctionByNFT } from "@/actions/auction";
import { getNFTById } from "@/actions/nft";
import { getUserById } from "@/actions/users";
import { getBidsByAuction } from "@/actions/bid";

export default async function AuctionTokenPage({ params }: { params: { tokenId: string } }) {
  const tokenId = Number(params.tokenId);
  const auctionRaw = await getAuctionByNFT(tokenId);
  if (!auctionRaw) return <div className="text-center py-20">Auction not found</div>;

  return (
    <AuctionDetail
      {...auctionRaw}
    />
  );
}
