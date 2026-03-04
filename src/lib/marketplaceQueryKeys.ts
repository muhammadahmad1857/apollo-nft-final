export const marketplaceQueryKeys = {
  all: ["marketplace"] as const,
  nfts: ["nfts"] as const,
  nft: (id?: number) => ["nft", id] as const,
  auction: (nftId?: number) => ["auction", nftId] as const,
  auctions: ["auctions"] as const,
  likedNFTs: (userId?: number | null) => ["likedNFTs", userId] as const,
  user: (wallet?: string) => ["user", wallet] as const,
  notifications: ["notifications"] as const,
};
