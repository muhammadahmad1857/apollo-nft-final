import { useWriteContract, useReadContract } from "wagmi";
import { marketplaceABIArray, marketplaceAddress } from "@/lib/wagmi/contracts";
import { parseEther } from "viem";

// List NFT
export function useListNFT() {
  const { writeContractAsync, isPending } = useWriteContract();
  const listNFT = async (tokenId: bigint, priceEth: string) => {
    return writeContractAsync({
      address: marketplaceAddress,
      abi: marketplaceABIArray,
      functionName: "list",
      args: [tokenId, parseEther(priceEth)],
    });
  };
  return { listNFT, isPending };
}

// Buy NFT
export function useBuyNFT() {
  const { writeContractAsync, isPending } = useWriteContract();
  const buyNFT = async (tokenId: bigint, price: bigint) => {
    return writeContractAsync({
      address: marketplaceAddress,
      abi: marketplaceABIArray,
      functionName: "buy",
      args: [tokenId],
      value: price,
    });
  };
  return { buyNFT, isPending };
}

// Cancel Listing
export function useCancelListing() {
  const { writeContractAsync, isPending } = useWriteContract();
  const cancelListing = async (tokenId: bigint) => {
    return writeContractAsync({
      address: marketplaceAddress,
      abi: marketplaceABIArray,
      functionName: "cancel",
      args: [tokenId],
    });
  };
  return { cancelListing, isPending };
}

// Read Listing
export function useListing(tokenId: bigint) {
  return useReadContract({
    address: marketplaceAddress,
    abi: marketplaceABIArray,
    functionName: "listings",
    args: [tokenId],
  });
}
