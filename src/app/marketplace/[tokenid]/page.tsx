/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import Link from "next/link";
import NFTInteractiveContent from "@/components/marketplace/nftPage";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { NotFound } from "@/components/notFound";
import { UniversalMediaIcon } from "@/components/ui/UniversalMediaIcon";
import { getNFTByTokenId } from "@/actions/nft";

// Force dynamic rendering + light ISR
export const dynamic = "force-dynamic";
export const revalidate = 30; // seconds

// ============================================================================
// Metadata (for social sharing)
// ============================================================================

// ============================================================================
// Main Server Component
// ============================================================================
export default async function NFTDetailPage({
  params,
}: {
  params: Promise<{ tokenid: string }>;
}) {
  const tokenId = Number((await params).tokenid);
  if (isNaN(tokenId) || tokenId < 1) {
    return (
      <div className="flex flex-col items-center justify-center">
        <NotFound title="No NFT FOUND" link="/dashboard" />
      </div>
    );
  }

  let owner: `0x${string}` | null = null;

  const dbNft = await getNFTByTokenId(tokenId);

  if (!dbNft) {
    return (
      <div className="flex flex-col items-center justify-center">
        <NotFound title="No NFT FOUND" link="/dashboard" />
      </div>
    );
  }

  // Get owner address from DB
  if (dbNft.owner?.walletAddress) {
    owner = dbNft.owner.walletAddress as `0x${string}`;
  }

  // Fetch metadata from tokenUri
  // try {
  //   const tokenUri = dbNft.tokenUri;
  //   const httpUri = tokenUri.replace(
  //     "ipfs://",
  //     `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`
  //   );
  //   const res = await fetch(httpUri, { next: { revalidate: 60 } });

  //   if (res.ok) {
  //     metadata = await res.json();
  //   }
  // } catch (err) {
  //   console.error("Error loading metadata:", err);
  // }

  // if (!metadata) {
  //   return (
  //     <div className="flex flex-col items-center justify-center">
  //       <NotFound title="No NFT FOUND" link="/dashboard" />
  //     </div>
  //   );
  // }
  // if (!metadata) return <div className="flex flex-col items-center justify-center"><NotFound title="No NFT FOUND" link="/dashboard"/></div>;;

  // const title = metadata.title || `NFT #${tokenId}`;
  // const description = metadata.description || "No description provided";
  // const artist = metadata.name || "Anonymous";
  // const cover = (metadata.image || metadata.cover || "")
  //   .replace("ipfs://",  `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);
  // const media = (metadata.media || "")
  //   .replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);
console.log("tokenUri", dbNft);
  return (
    <main className="min-h-screen">
      <Header/>
      <div className="max-w-6xl mx-auto  py-14 px-4 md:px-8 lg:px-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white hover:text-zinc-300 mb-8 transition-colors"
        >
          ← Back to gallery
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Media / Cover */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-linear-to-br from-zinc-900 to-black border border-zinc-800 shadow-2xl">
              {dbNft.imageUrl ? (
                <Image
                  src={dbNft.imageUrl.replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`)}
                  alt={dbNft.title || `NFT #${tokenId}`}
                  width={800}
                  height={800}
                  className="w-full aspect-square object-cover"
                  priority
                />
              ) : (
                <UniversalMediaIcon  tokenUri={dbNft.tokenUri} uri={dbNft.mediaUrl} fileType={dbNft.fileType} className="w-full aspect-square" />
              )}
            </div>

            {/* {media && mediaType !== "unknown" && (
              <div className="text-center text-sm text-zinc-500">
                {mediaType === "audio" ? "Audio track included" : "Video content available"}
              </div>
            )} */}
          </div>

          {/* Right - Info + Actions */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">{dbNft.title || `NFT #${tokenId}`}</h1>
              <div className="flex items-center gap-4 text-white">
                <span>By {dbNft.name}</span>
                <span>•</span>
                <span>#{tokenId}</span>
                {owner && (
                  <>
                    <span>•</span>
                    <span className="font-mono">
                      Owner: {owner.slice(0, 6)}...{owner.slice(-4)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed font-bold text-zinc-300">
                {dbNft.description}
              </p>
            </div>

            {/* Client-side interactive content */}
            <NFTInteractiveContent
              tokenId={tokenId}
              title={dbNft.title || `NFT #${tokenId}`}
              name={dbNft.name}
              media={dbNft.mediaUrl}
              mintPrice={dbNft?.mintPrice}
              ownerAddress={owner}
              tokenUri={dbNft.tokenUri}
              fileType={dbNft.fileType}
            />

            {/* Optional extra info */}
            <div className="pt-6 border-t border-zinc-800 text-sm text-zinc-500">
              <p>Metadata loaded from IPFS via Pinata gateway</p>
              <p className="mt-1">
                View on-chain:{" "}
                <a
                  href={`https://apolloscan.io/address/${nftAddress}#readContract`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  Contract <ExternalLink size={14} />
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}