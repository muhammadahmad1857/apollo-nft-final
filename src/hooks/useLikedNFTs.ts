import { useQuery } from "@tanstack/react-query";
import { getLikedNFTsWithDetails } from "@/actions/nft-likes";

export function useLikedNFTs(userId: number | null) {
  return useQuery({
    queryKey: ["likedNFTs", userId],
    queryFn: async () => {
      if (!userId) return [];
      return getLikedNFTsWithDetails(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
