import { useEffect, useState } from "react";
import { auctionAddress, auctionABIArray } from "@/lib/wagmi/contracts";
import { createPublicClient, http } from "viem";
import { mainnet } from "wagmi/chains";
import { useAccount } from "wagmi";

export function usePendingReturns() {
  const { address } = useAccount();
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setPendingAmount(0);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const publicClient = createPublicClient({
          chain: mainnet,
          transport: http(),
        });
        const result = await publicClient.readContract({
          address: auctionAddress,
          abi: auctionABIArray,
          functionName: "pendingReturns",
          args: [address],
        });
        setPendingAmount(Number(result) / 1e18);
      } catch {
        setPendingAmount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  return { pendingAmount, loading };
}
