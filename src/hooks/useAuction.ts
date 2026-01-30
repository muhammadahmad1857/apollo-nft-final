// hooks/useAuction.ts
import { useState, useRef, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import type { BaseError } from "wagmi";
import {auctionAddress as contractAddress, auctionABIArray as abi} from "@/lib/wagmi/contracts"


export function useAuction() {
  const { address, isConnected } = useAccount();
  const toastIdRef = useRef<string | number | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const { writeContract, data: txHash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: txError, error: txReceiptError } =
    useWaitForTransactionReceipt({ hash: txHash });

  /* ---------------------------
     Core contract interactions
  --------------------------- */
  const createAuction = useCallback(
    async ({ tokenId, duration, minBid }: { tokenId: number; duration: number; minBid: number }) => {
      if (!isConnected) return toast.error("Connect your wallet first");
      setIsBusy(true);

      try {
        writeContract({
          address: contractAddress,
          abi,
          functionName: "createAuction",
          args: [tokenId, duration, minBid],
        });
      } catch (err) {
        console.error(err);
        setIsBusy(false);
      }
    },
    [abi, contractAddress, isConnected, writeContract]
  );

  const bid = useCallback(
    async ({ tokenId, amount }: { tokenId: number; amount: bigint }) => {
      if (!isConnected) return toast.error("Connect your wallet first");
      setIsBusy(true);

      try {
        writeContract({
          address: contractAddress,
          abi,
          functionName: "bid",
          args: [tokenId],
          value: amount,
        });
      } catch (err) {
        console.error(err);
        setIsBusy(false);
      }
    },
    [abi, contractAddress, isConnected, writeContract]
  );

  const settle = useCallback(
    async (tokenId: number) => {
      if (!isConnected) return toast.error("Connect your wallet first");
      setIsBusy(true);

      try {
        writeContract({
          address: contractAddress,
          abi,
          functionName: "settle",
          args: [tokenId],
        });
      } catch (err) {
        console.error(err);
        setIsBusy(false);
      }
    },
    [abi, contractAddress, isConnected, writeContract]
  );

  const withdraw = useCallback(async () => {
    if (!isConnected) return toast.error("Connect your wallet first");
    setIsBusy(true);

    try {
      writeContract({
        address: contractAddress,
        abi,
        functionName: "withdraw",
      });
    } catch (err) {
      console.error(err);
      setIsBusy(false);
    }
  }, [abi, contractAddress, isConnected, writeContract]);

  /* ---------------------------
     Toast + transaction lifecycle
  --------------------------- */
  const handleToasts = useCallback(() => {
    if (writeError) {
      const msg = (writeError as BaseError).shortMessage || writeError.message;
      toast.error(msg.includes("insufficient funds") ? "Not enough ETH ⛽" : msg);
    }

    if (isConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Transaction in progress...");
    }

    if (isSuccess && toastIdRef.current) {
      toast.success("Transaction successful ✅", { id: toastIdRef.current });
      toastIdRef.current = null;
      setIsBusy(false);
    }

    if (txError && toastIdRef.current) {
      const msg = (txReceiptError as BaseError)?.shortMessage || txReceiptError?.message;
      toast.error(msg || "Transaction failed ❌", { id: toastIdRef.current });
      toastIdRef.current = null;
      setIsBusy(false);
    }
  }, [isConfirming, isSuccess, txError, writeError, txReceiptError]);

  return {
    createAuction,
    bid,
    settle,
    withdraw,
    handleToasts,
    isBusy: isBusy || isPending || isConfirming,
  };
}
