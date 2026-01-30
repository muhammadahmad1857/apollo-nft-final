import { type ClassValue, clsx } from "clsx";
import { Metadata, ResolvingMetadata } from "next";
import { twMerge } from "tailwind-merge";
import { createPublicClient, http } from "viem";
import { spring } from "framer-motion";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const FADE_DOWN_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { type: spring } },
};
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "").toLowerCase() as `0x${string}`;

// export async function generateMetadata(
//   { params }: { params: { tokenId: string } },
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const tokenId = Number(params.tokenId);
//   if (isNaN(tokenId)) return { title: "Invalid NFT" };

//   const publicClient = createPublicClient({
//     transport: http(process.env.NEXT_PUBLIC_RPC_URL),
//   });

//   try {
//     const uri = (await publicClient.readContract({
//       address: CONTRACT_ADDRESS,
//       abi: NFT_ABI,
//       functionName: "tokenURI",
//       args: [BigInt(tokenId)],
//     })) as string;

//     const httpUri = uri.replace("ipfs://", "https://process.env.NEXT_PUBLIC_GATEWAY_URL/ipfs/");
//     const res = await fetch(httpUri, { next: { revalidate: 60 } });
//     if (!res.ok) throw new Error("Metadata fetch failed");

//     const data = await res.json();

//     const image = (data.image || data.cover || "")
//       .replace("ipfs://", "https://process.env.NEXT_PUBLIC_GATEWAY_URL/ipfs/")
//       .trim();

//     return {
//       title: data.title || `NFT #${tokenId}`,
//       description: data.description || "Unique digital collectible",
//       openGraph: {
//         title: data.title || `NFT #${tokenId}`,
//         description: data.description || "Check out this amazing piece!",
//         url: `https://apollo-nft-final.vercel.app/marketplace/${tokenId}`,
//         siteName: "Your NFT Platform",
//         images: image
//           ? [
//               {
//                 url: image,
//                 width: 1200,
//                 height: 630,
//                 alt: data.title || `NFT #${tokenId}`,
//               },
//             ]
//           : undefined,
//         type: "website",
//       },
//       twitter: {
//         card: "summary_large_image",
//         title: data.title || `NFT #${tokenId}`,
//         description: data.description || "Unique digital collectible",
//         images: image ? [image] : undefined,
//       },
//     };
//   } catch (e) {
//     console.error("Metadata generation failed:", e);
//     return {
//       title: `NFT #${tokenId} • Not Found`,
//       description: "The requested NFT could not be loaded",
//     };
//   }
// }