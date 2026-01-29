import { getNFTByTokenId } from "@/actions/nft";
import { useAuction } from "@/hooks/useNft";
import { NFTCard } from "@/components/nft-card";

export default async function MarketplaceTokenPage({ params }: { params: { tokenid: string } }) {
  const tokenId = Number(params.tokenid);
  const nft = await getNFTByTokenId(tokenId);
  // Optionally fetch auction info here if needed for SSR
  // const auction = await getAuctionByNFT(tokenId);
  if (!nft) return <div className="p-8">NFT not found.</div>;
  return (
    <div className="p-8 flex flex-col items-center">
      <NFTCard nft={nft} owner={false} />
      {/* Add more NFT/auction details here as needed */}
    </div>
  );
}
