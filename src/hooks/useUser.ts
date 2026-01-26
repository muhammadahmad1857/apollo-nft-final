// hooks/useUser.ts
import { useQuery } from "@tanstack/react-query";

export const useUser = (address?: string) =>
  useQuery({
    queryKey: ["user", address],
    enabled: !!address,
    queryFn: async () => {
      const res = await fetch(`/api/users/${address}`);
      if (!res.ok) return null;
      return res.json();
    },
  });
