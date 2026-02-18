import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getArtistProfileData } from "@/actions/users";
import { ArtistProfileHeader, ArtistProfileHeaderSkeleton } from "@/components/artist/ArtistProfileHeader";
import { ArtistNFTGrid, ArtistNFTGridSkeleton } from "@/components/artist/ArtistNFTGrid";

interface ArtistPageProps {
  params: {
    walletAddress: string;
  };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { walletAddress } = await params;
  
  // Decode the wallet address in case it's URL encoded
  const decodedAddress = decodeURIComponent(walletAddress);
console.log("Decoded wallet address:", decodedAddress);
  const profileData = await getArtistProfileData(decodedAddress);
console.log("Fetched profile data:", profileData);
  if (!profileData) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <Suspense fallback={<ArtistProfileHeaderSkeleton />}>
            <ArtistProfileHeader user={profileData.user} stats={profileData.stats} />
          </Suspense>

          {/* NFTs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Active Listings & Auctions</h2>
              <p className="text-muted-foreground">
                {profileData.stats.totalNFTs} {profileData.stats.totalNFTs === 1 ? "NFT" : "NFTs"}
              </p>
            </div>

            <Suspense fallback={<ArtistNFTGridSkeleton />}>
              <ArtistNFTGrid nfts={profileData.nfts} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ArtistPageProps) {
  const { walletAddress } = params;
  const decodedAddress = decodeURIComponent(walletAddress);
  const profileData = await getArtistProfileData(decodedAddress);

  if (!profileData) {
    return {
      title: "Artist Not Found",
    };
  }

  return {
    title: `${profileData.user.name || "Artist"} - Apollo NFT`,
    description: `View ${profileData.user.name || "this artist"}'s NFT collection on Apollo NFT marketplace`,
  };
}
