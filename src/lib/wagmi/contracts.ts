import nftABI from './nft.json'
import auctionABI from './auction.json'
import marketplaceABI from './marketplace.json'
import type { Abi } from "abitype";
// Contract addresses
export const nftAddress: `0x${string}` = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_NFT as `0x${string}` || '0x123...' as `0x${string}`;
export const auctionAddress: `0x${string}` = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_AUCTION as `0x${string}` || '0x456...' as `0x${string}`;
export const marketplaceAddress: `0x${string}` = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MARKETPLACE as `0x${string}` || '0x789...' as `0x${string}`;

export const nftABIArray = nftABI as Abi;
export const auctionABIArray = auctionABI as Abi;
export const marketplaceABIArray = marketplaceABI as Abi;
