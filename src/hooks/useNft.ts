import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplaceApi } from "@/lib/marketplaceApi";

export function useNFT(tokenid?: number) {
  return useQuery({
    queryKey: ["nft", tokenid],
    enabled: !!tokenid,
    queryFn: async () => {
      if (!tokenid) return null;
      return await marketplaceApi.nfts.getById(tokenid);
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
      return await marketplaceApi.auctions.getByNft(nftId);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNFT() {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await marketplaceApi.nfts.update(id, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nft", variables.id] });
    },
  });
}

export function useArchiveNFT() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ownerId }: { id: number; ownerId: number }) => {
      return await marketplaceApi.nfts.archive(id, ownerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nft"] });
    },
  });
}

export function useUnarchiveNFT() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ownerId }: { id: number; ownerId: number }) => {
      return await marketplaceApi.nfts.unarchive(id, ownerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nft"] });
    },
  });
}
