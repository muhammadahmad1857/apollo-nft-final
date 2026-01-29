import { useWriteContract } from "wagmi";
import { apnftAbi } from "@/lib/abi/apnftAbi";

export function useUpdateRoyalty() {
  const { writeContractAsync, isPending } = useWriteContract();

  const updateRoyalty = async (
    nftAddress: `0x${string}`,
    tokenId: bigint,
    newBps: bigint
  ) => {
    return writeContractAsync({
      address: nftAddress,
      abi: apnftAbi,
      functionName: "updateRoyalty",
      args: [tokenId, newBps],
    });
  };

  return { updateRoyalty, isPending };
}
