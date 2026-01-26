// hooks/useCreateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateUser = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      walletAddress: string;
      username: string;
    }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["user", vars.walletAddress] });
    },
  });
};
