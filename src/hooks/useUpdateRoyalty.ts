import { useWriteContract } from "wagmi";
import { nftABIArray, nftAddress as APNFTAddress } from "@/lib/wagmi/contracts";

export function useUpdateRoyalty() {
  const { writeContractAsync, isPending } = useWriteContract();

  const updateRoyalty = async (
    nftAddress: `0x${string}` = APNFTAddress,
    tokenId: bigint,
    newBps: bigint
  ) => {
    return writeContractAsync({
      address: nftAddress,
      abi: nftABIArray,
      functionName: "updateRoyalty",
      args: [tokenId, newBps],
    });
  };

  return { updateRoyalty, isPending };
}
