import { useState, useRef, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import type { BaseError } from "wagmi";
import type { Abi } from "abitype";

import { getFilesByWallet, updateFile } from "@/actions/files";

interface UseMintContractProps {
  contractAddress: `0x${string}`;
  abi: Abi;
}

export function useMintContract({
  contractAddress,
  abi,
}: UseMintContractProps) {
  const { address, isConnected } = useAccount();
  const toastIdRef = useRef<string | number | null>(null);

  // Track URIs that were actually minted
  const mintedUrisRef = useRef<string[]>([]);

  const [isBusy, setIsBusy] = useState(false);

  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: txError,
    error: txReceiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* ----------------------------------------
     Update mint status in DB
  ---------------------------------------- */
  const updateMintStatus = useCallback(
    async (fileIpfsUrls: string[]) => {
      if (!address || !fileIpfsUrls.length) return;

      try {
        const files = await getFilesByWallet(address, false);

        for (const uri of fileIpfsUrls) {
          const file = files.find((f) => f.ipfsUrl === uri);
          if (!file?.id) continue;

          await updateFile(file.id, { isMinted: true });
        }
      } catch (err) {
        console.error("Error updating mint status:", err);
      }
    },
    [address]
  );

  /* ----------------------------------------
     Mint function
  ---------------------------------------- */
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

      const urisArray = Array.isArray(tokenURIs)
        ? tokenURIs
        : [tokenURIs];

      if (!urisArray.length) {
        toast.error("No token URI provided");
        return;
      }

      // Store URIs so we can update DB after success
      mintedUrisRef.current = urisArray;

      setIsBusy(true);

      try {
        writeContract({
          address: contractAddress,
          abi,
          functionName: isBatch ? "batchMint" : "mint",
          args: isBatch
            ? [urisArray[0], quantity, royaltyBps]
            : [urisArray[0], royaltyBps],
          value: !isBatch ? BigInt(0.1 * 1e18):BigInt(0.1 * 1e18) * BigInt(quantity),
        });
      } catch (err) {
        console.error(err);
        setIsBusy(false);
      }
    },
    [abi, contractAddress, isConnected, writeContract]
  );

  /* ----------------------------------------
     Toast + transaction lifecycle
  ---------------------------------------- */
  const handleToasts = useCallback(() => {
    // Write error (before tx submission)
    if (writeError) {
      const msg =
        (writeError as BaseError).shortMessage ||
        writeError.message;
      toast.error(
        msg.includes("insufficient funds")
          ? "Not enough ETH ⛽"
          : msg
      );
    }

    // Tx pending
    if (isConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading(
        "Transaction in progress..."
      );
    }

    // Tx success
    if (isSuccess && toastIdRef.current) {
      toast.success("Mint successful 🎉", {
        id: toastIdRef.current,
      });

      if (mintedUrisRef.current.length) {
        updateMintStatus(mintedUrisRef.current);
      }

      toastIdRef.current = null;
      setIsBusy(false);
    }

    // Tx failed
    if (txError && toastIdRef.current) {
      const msg =
        (txReceiptError as BaseError)?.shortMessage ||
        txReceiptError?.message;

      toast.error(msg || "Transaction failed", {
        id: toastIdRef.current,
      });

      toastIdRef.current = null;
      setIsBusy(false);
    }
  }, [
    isConfirming,
    isSuccess,
    txError,
    writeError,
    txReceiptError,
    updateMintStatus,
  ]);

  return {
    mint,
    handleToasts,
    isBusy: isBusy || isPending || isConfirming,
  };
}
