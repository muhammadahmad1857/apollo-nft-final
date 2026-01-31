import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNFTById, updateNFT } from "@/actions/nft";
import { getAuctionByNFT } from "@/actions/auction";

export function useNFT(tokenid?: number) {
  return useQuery({
    queryKey: ["nft", tokenid],
    enabled: !!tokenid,
    queryFn: async () => {
      if (!tokenid) return null;
      return await getNFTById(tokenid);
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useAuction(nftId?: number) {
  return useQuery({
    queryKey: ["auction", nftId],
    enabled: !!nftId,
    queryFn: async () => {
      if (!nftId) return null;
      return await getAuctionByNFT(nftId);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNFT() {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await updateNFT(id, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nft", variables.id] });
    },
  });
}
