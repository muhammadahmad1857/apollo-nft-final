import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "@/lib/marketplaceApi";

export function useLikedNFTs(userId: number | null) {
  return useQuery({
    queryKey: ["likedNFTs", userId],
    queryFn: async () => {
      if (!userId) return [];
      return marketplaceApi.likes.getLikedNfts(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
