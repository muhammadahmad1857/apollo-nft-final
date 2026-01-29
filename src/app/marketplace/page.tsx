/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllUsers } from "@/actions/users";
import { getNFTsByOwner } from "@/actions/nft";
import Link from "next/link";
import Image from "next/image";

export default async function MarketplacePage() {
  // Get latest 3 artists (users who own NFTs)
  const users = await getAllUsers(10, 0); // Fetch more to filter below
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artists: any[] = [];
  for (const user of users) {
    const nfts = await getNFTsByOwner(user.id);
    if (nfts.length > 0) {
      artists.push({ ...user, nfts });
      if (artists.length === 3) break;
    }
  }

  return (
    <div className="py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Featured Artists</h1>
      <div className="flex gap-8 overflow-x-auto">
        {artists.map((artist) => (
          <div key={artist.walletAddress} className="min-w-[320px] bg-card rounded-lg shadow p-4 flex flex-col items-center">
            <Image src={artist.avatarUrl || "/default-avatar.png"} alt={artist.name} width={80} height={80} className="rounded-full mb-2" />
            <h2 className="text-xl font-semibold mb-1">{artist.name}</h2>
            <span className="text-xs text-muted-foreground mb-2">{artist.walletAddress.slice(0, 8)}...</span>
            <div className="flex gap-2 mb-2">
              {artist.nfts.slice(0, 3).map((nft: any) => (
                <Image key={nft.id} src={nft.image} alt={nft.title} width={60} height={60} className="rounded" />
              ))}
            </div>
            <Link href={`/p/${artist.walletAddress}`} className="text-primary underline mt-2">View Artist</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
