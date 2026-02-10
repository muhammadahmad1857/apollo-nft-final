/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Image from "next/image";
import {Music, ExternalLink, } from "lucide-react";
import { createPublicClient, http } from "viem";
import {  nftABIArray,nftAddress } from "@/lib/wagmi/contracts"; // ← adjust path
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
  console.log(tokenId,(await params).tokenid)
  if (isNaN(tokenId) || tokenId < 1) {
    return <div className="flex flex-col items-center justify-center"><NotFound title="No NFT FOUND" link="/dashboard"/></div>;
  };

  const publicClient = createPublicClient({
    transport: http("https://mainnet-rpc.apolloscan.io"),
  });

  let metadata: any = null;
  let owner: `0x${string}` | null = null;
  let mediaType: "audio" | "video" | "unknown" = "unknown";
  const dbNft = await getNFTByTokenId(tokenId);
  const detectMediaType = async (url: string) => {
    if (!url) return;

    try {
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) throw new Error("HEAD request failed");

      const contentType =
        response.headers.get("content-type")?.toLowerCase() || "";

      if (contentType.startsWith("audio/")) {
        mediaType = "audio"
        console.log("Media tis audio")
      } else if (contentType.startsWith("video/")) {
        mediaType="video";
        console.log("Media tis video")

      } else {
        // Fallback to extension
       mediaType='unknown'
        console.log("Media tis unknown")

      }
    } catch (err) {
      console.warn("Media type detection failed:", err);
       mediaType='unknown'
    }
  };
  try {
    const uri = (await publicClient.readContract({
      address: nftAddress,
      abi: nftABIArray,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    })) as string;

    const httpUri = uri.replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);
    const res = await fetch(httpUri, { next: { revalidate: 60 } });

    if (res.ok) {
      metadata = await res.json();
    }

    // Optional: get current owner
    try {
      owner = (await publicClient.readContract({
        address: nftAddress,
        abi: nftABIArray,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      })) as `0x${string}`;
    } catch {
      // token might not exist or contract doesn't have ownerOf
    }

    // Simple media type detection (extension based)
    const mediaUrl = (metadata?.media || "")
      .replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);
    if (mediaUrl) {
        console.log("Detecting media type for url",mediaUrl)
      detectMediaType(mediaUrl)
    }
  } catch (err) {
    console.error("Error loading NFT:", err);
  }
  console.log("Metadata",metadata,mediaType)
  if (!metadata) return <div className="flex flex-col items-center justify-center"><NotFound title="No NFT FOUND" link="/dashboard"/></div>;;

  const title = metadata.title || `NFT #${tokenId}`;
  const description = metadata.description || "No description provided";
  const artist = metadata.name || "Anonymous";
  const cover = (metadata.image || metadata.cover || "")
    .replace("ipfs://",  `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);
  const media = (metadata.media || "")
    .replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 lg:px-16">
      <Header/>
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-8 transition-colors"
        >
          ← Back to gallery
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Media / Cover */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden bg-linear-to-br from-zinc-900 to-black border border-zinc-800 shadow-2xl">
              {cover ? (
                <Image
                  src={cover}
                  alt={title}
                  width={800}
                  height={800}
                  className="w-full aspect-square object-cover"
                  priority
                />
              ) : (
                <UniversalMediaIcon uri={media} className="w-full aspect-square" />
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
              <h1 className="text-4xl md:text-5xl font-bold mb-3">{title}</h1>
              <div className="flex items-center gap-4 text-zinc-400">
                <span>By {artist}</span>
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
              <p className="text-lg leading-relaxed text-zinc-300">
                {description}
              </p>
            </div>

            {/* Client-side interactive content */}
            <NFTInteractiveContent
              tokenId={tokenId}
              title={title}
              name={artist}
              media={media}
              mintPrice={dbNft?.mintPrice}
              ownerAddress={owner}
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
      <Footer/>
    </main>
  );
}