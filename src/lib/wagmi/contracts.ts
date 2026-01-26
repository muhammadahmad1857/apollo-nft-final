import nftABI from './nft.json'
import auctionABI from './auction.json'
import marketplaceABI from './marketplace.json'
import type { Abi } from "abitype";
// Contract addresses
export const nftAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_NFT || '0x123...'
export const auctionAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_AUCTION || '0x456...'
export const marketplaceAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MARKETPLACE || '0x789...'

export const nftABIArray = nftABI as Abi;
export const auctionABIArray = auctionABI as Abi;
export const marketplaceABIArray = marketplaceABI as Abi;
