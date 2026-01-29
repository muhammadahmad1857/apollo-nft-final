import { getUserByWallet } from "@/actions/users";
import { getNFTsByOwner } from "@/actions/nft";
import Image from "next/image";

export default async function ArtistPage({ params }: { params: { wallet_id: string } }) {
  const user = await getUserByWallet(params.wallet_id);
  if (!user) return <div className="p-8">Artist not found.</div>;
  const nfts = await getNFTsByOwner(user.id);
  return (
    <div className="p-8">
      <div className="flex items-center gap-6 mb-8">
        <Image src={user.avatarUrl || "/default-avatar.png"} alt={user.name} width={100} height={100} className="rounded-full" />
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <div className="text-muted-foreground">{user.walletAddress}</div>
          <div className="text-muted-foreground text-sm">{user.email}</div>
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-4">NFTs by {user.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nfts.map((nft: any) => (
          <div key={nft.id} className="bg-card rounded-lg shadow p-4 flex flex-col items-center">
            <Image src={nft.image} alt={nft.title} width={180} height={180} className="rounded mb-2" />
            <div className="font-semibold text-lg mb-1">{nft.title}</div>
            <div className="text-xs text-muted-foreground mb-1">{nft.category}</div>
            <div className="text-xs text-muted-foreground">Likes: {nft.likes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
