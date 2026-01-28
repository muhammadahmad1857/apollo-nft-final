// hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";
import {getUserByWallet} from "@/actions/users"
export const useUser = (address?: string) =>
  useQuery({
    queryKey: ["user", address],
    enabled: !!address,
    queryFn: async () => {
      if(!address) return null
      const res = await getUserByWallet(address);
      if (!res.ok) return null;
      return res.json();
    },
  });
