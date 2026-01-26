import { useState, useRef, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import type { BaseError } from "wagmi";
import type { Abi } from "abitype";

interface UseMintContractProps {
  contractAddress: `0x${string}`;
  abi: Abi;
}

export function useMintContract({ contractAddress, abi }: UseMintContractProps) {
  const { address, isConnected } = useAccount();
  const toastIdRef = useRef<string | number | null>(null);

  const [isBusy, setIsBusy] = useState(false);

  const { writeContract, data: txHash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: txError, error: txReceiptError } =
    useWaitForTransactionReceipt({ hash: txHash });

  const updateMintStatus = useCallback(
    async (fileIpfsUrl: string | string[]) => {
      if (!address) return;
      const supabase = createClient();
      const uris = Array.isArray(fileIpfsUrl) ? fileIpfsUrl : [fileIpfsUrl];

      for (const uri of uris) {
        try {
          const { data, error } = await supabase
            .from("files")
            .select("id")
            .eq("ipfsUrl", uri)
            .eq("wallet_id", address)
            .single();

          if (!data?.id || error) continue;

          await supabase.from("files").update({ isMinted: true }).eq("id", data.id);
        } catch (err) {
          console.error("Error updating mint status:", err);
        }
      }
    },
    [address]
  );

  const mint = useCallback(
    async ({
      tokenURIs,
      quantity = 1,
      royaltyBps = 0,
      isBatch = false,
    }: {
      tokenURIs: string | string[];
      quantity?: number;
      royaltyBps?: number;
      isBatch?: boolean;
    }) => {
      if (!isConnected) {
        toast.error("Connect your wallet first");
        return;
      }

      const urisArray = Array.isArray(tokenURIs) ? tokenURIs : [tokenURIs];
      if (!urisArray.length) {
        toast.error("No token URI provided");
        return;
      }

      setIsBusy(true);

      try {
        writeContract({
          address: contractAddress,
          abi,
          functionName: isBatch ? "batchMint" : "mint",
          args: isBatch
            ? [urisArray[0], quantity, royaltyBps] // batchMint uses first URI + quantity
            : [urisArray[0], royaltyBps],
          value: BigInt(0), // or handle MINT_PRICE * quantity if you pass it
        });
      } catch (err) {
        console.error(err);
      }
    },
    [abi, contractAddress, isConnected, writeContract]
  );

  // Handle toast notifications
  const handleToasts = () => {
    // Write errors
    if (writeError) {
      const msg = (writeError as BaseError).shortMessage || writeError.message;
      toast.error(msg.includes("insufficient funds") ? "Not enough ETH ⛽" : msg);
    }

    // Transaction confirmation
    if (isConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Transaction in progress...");
    }

    if (isSuccess && toastIdRef.current) {
      toast.success("Mint successful 🎉", { id: toastIdRef.current });
      updateMintStatus(writeError ? [] : txHash); // optionally pass URIs
      toastIdRef.current = null;
      setIsBusy(false);
    }

    if (txError && toastIdRef.current) {
      const msg = (txReceiptError as BaseError)?.shortMessage || txReceiptError?.message;
      toast.error(msg || "Transaction failed", { id: toastIdRef.current });
      toastIdRef.current = null;
      setIsBusy(false);
    }
  };

  return {
    mint,
    handleToasts,
    isBusy: isBusy || isPending || isConfirming,
  };
}
