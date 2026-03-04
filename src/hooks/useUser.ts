// hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "@/lib/marketplaceApi";
export const useUser = (address?: string) =>
  useQuery({
    queryKey: ["user", address],
    enabled: !!address,
    queryFn: async () => {
      if(!address) return null
      const res = await marketplaceApi.users.getByWallet(address);
      return res;
    },
  });
