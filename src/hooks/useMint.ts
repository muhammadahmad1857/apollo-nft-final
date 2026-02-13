// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useRef, useCallback } from "react";
// import {
//   useAccount,
//   useWriteContract,
//   useWaitForTransactionReceipt,
//   useReadContract,
// } from "wagmi";
// import { toast } from "sonner";
// import type { BaseError } from "wagmi";
// // import type { Abi } from "abitype";

// import { getFilesByWallet, updateFile } from "@/actions/files";
// import {
//   nftABIArray as abi,
//   nftAddress as contractAddress,
// } from "@/lib/wagmi/contracts";
// import { formatUnits } from "viem";

// export function useMintContract() {
//   const { address, isConnected } = useAccount();
//   const toastIdRef = useRef<string | number | null>(null);
//   const resolveRef = useRef<((v: boolean) => void) | null>(null);
//   const rejectRef = useRef<((v: boolean) => void) | null>(null);
//   const {
//     data: mintPrice,
//     isLoading: isPriceLoading,
//     refetch,
//   } = useReadContract({
//     address: contractAddress,
//     abi: abi,
//     functionName: "MINT_PRICE",
//   });
//   // Track URIs that were actually minted
//   const mintedUrisRef = useRef<string[]>([]);

//   const [isBusy, setIsBusy] = useState(false);

//   const {
//     writeContract,
//     data: txHash,
//     error: writeError,
//     isPending,
//   } = useWriteContract();

//   const {
//     isLoading: isConfirming,
//     isSuccess,
//     isError: txError,
//     error: txReceiptError,
//       data: receipt,

//   } = useWaitForTransactionReceipt({ hash: txHash });

//   /* ----------------------------------------
//      Update mint status in DB
//   ---------------------------------------- */
//   const updateMintStatus = useCallback(
//     async (fileIpfsUrls: string[]) => {
//       if (!address || !fileIpfsUrls.length) return;

//       try {
//         const files = await getFilesByWallet(address, false);

//         for (const uri of fileIpfsUrls) {
//           const file = files.find((f) => f.ipfsUrl === uri);
//           if (!file?.id) continue;

//           await updateFile(file.id, { isMinted: true });
//         }
//       } catch (err) {
//         console.error("Error updating mint status:", err);
//       }
//     },
//     [address],
//   );

//   /* ----------------------------------------
//      Mint function
//   ---------------------------------------- */
//   // const mint = useCallback(
//   //   async ({
//   //     tokenURIs,
//   //     quantity = 1,
//   //     royaltyBps = 0,
//   //     isBatch = false,
//   //   }: {
//   //     tokenURIs: string | string[];
//   //     quantity?: number;
//   //     royaltyBps?: number;
//   //     isBatch?: boolean;
//   //   }) => {
//   //     if (!isConnected) {
//   //       toast.error("Connect your wallet first");
//   //       return;
//   //     }

//   //     const urisArray = Array.isArray(tokenURIs)
//   //       ? tokenURIs
//   //       : [tokenURIs];

//   //     if (!urisArray.length) {
//   //       toast.error("No token URI provided");
//   //       return;
//   //     }

//   //     // Store URIs so we can update DB after success
//   //     mintedUrisRef.current = urisArray;

//   //     setIsBusy(true);

//   //     try {
//   //       writeContract({
//   //         address: contractAddress,
//   //         abi,
//   //         functionName: isBatch ? "batchMint" : "mint",
//   //         args: isBatch
//   //           ? [urisArray[0], quantity, royaltyBps]
//   //           : [urisArray[0], royaltyBps],
//   //         value: !isBatch ? BigInt(0.1 * 1e18):BigInt(0.1 * 1e18) * BigInt(quantity),
//   //       });
//   //     } catch (err) {
//   //       console.error(err);
//   //       setIsBusy(false);
//   //     }
//   //   },
//   //   [abi, contractAddress, isConnected, writeContract]
//   // );

//   const mint = useCallback(
//     async ({
//       tokenURIs,
//       quantity = 1,
//       royaltyBps = 0,
//       isBatch = false,
//     }: {
//       tokenURIs: string | string[];
//       quantity?: number;
//       royaltyBps?: number;
//       isBatch?: boolean;
//     }): Promise<boolean> => {
//       if (!isConnected) {
//         toast.error("Connect your wallet first");
//         return false;
//       }

//       const urisArray = Array.isArray(tokenURIs) ? tokenURIs : [tokenURIs];

//       if (!urisArray.length) {
//         toast.error("No token URI provided");
//         return false;
//       }

//       mintedUrisRef.current = urisArray;
//       setIsBusy(true);

//       return new Promise<boolean>((resolve, reject) => {
//         resolveRef.current = resolve;
//         rejectRef.current = reject;
//         if (!mintPrice) {
//           toast.error("Mint price not loaded yet");
//           setIsBusy(false);
//           reject(false);
//           return;
//         }
//         try {
//           writeContract({
//             address: contractAddress,
//             abi,
//             functionName: isBatch ? "batchMint" : "mint",
//             args: isBatch
//               ? [urisArray[0], quantity, royaltyBps]
//               : [urisArray[0], royaltyBps],
//             value: !isBatch
//               ? (mintPrice as bigint)
//               : (mintPrice as bigint) * BigInt(quantity),
//           });
//         } catch (err) {
//           console.error(err);
//           setIsBusy(false);
//           reject(false);
//         }
//       });
//     },
//     [abi, contractAddress, isConnected, writeContract, mintPrice],
//   );

//   /* ----------------------------------------
//      Toast + transaction lifecycle
//   ---------------------------------------- */
//   const handleToasts = useCallback(() => {
//     // Write error (before tx submission)
//     if (writeError) {
//       const msg = (writeError as BaseError).shortMessage || writeError.message;
//       toast.error(
//         msg.includes("insufficient funds") ? "Not enough APOLLO ⛽" : msg,
//       );
//       rejectRef.current?.(false);
//       resolveRef.current = null;
//       rejectRef.current = null;
//       setIsBusy(false);
//     }

//     // Tx pending
//     if (isConfirming && !toastIdRef.current) {
//       toastIdRef.current = toast.loading("Transaction in progress...");
//     }

//     // Tx success
//     // if (isSuccess && toastIdRef.current) {
//     //   fetch('/api/sync-mints', {
//     //   method: 'GET',
//     //   // headers: {
//     //   //   'x-sync-secret': process.env.NEXT_PUBLIC_SYNC_SECRET || 'dev-secret' // use public for simplicity or env
//     //   // }
//     // }).catch(() => {});
//     //   toast.success("NFT minted successfully 🎉", {
//     //     id: toastIdRef.current,
//     //   });

//     //   if (mintedUrisRef.current.length) {
//     //     updateMintStatus(mintedUrisRef.current);
//     //   }

//     //   toastIdRef.current = null;
//     //   setIsBusy(false);
//     // }
//     if (isSuccess && toastIdRef.current) {
//       fetch("/api/sync-mints").catch(() => {});

//       toast.success("NFT minted successfully 🎉", {
//         id: toastIdRef.current,
//       });

//       if (mintedUrisRef.current.length) {
//         updateMintStatus(mintedUrisRef.current);
//       }

//       resolveRef.current?.(true);
//       resolveRef.current = null;
//       rejectRef.current = null;

//       toastIdRef.current = null;
//       setIsBusy(false);
//     }

//     // Tx failed
//     if (txError && toastIdRef.current) {
//       const msg =
//         (txReceiptError as BaseError)?.shortMessage || txReceiptError?.message;

//       toast.error(msg || "Transaction failed", {
//         id: toastIdRef.current,
//       });

//       rejectRef.current?.(false);
//       resolveRef.current = null;
//       rejectRef.current = null;

//       toastIdRef.current = null;
//       setIsBusy(false);
//     }
//   }, [
//     isConfirming,
//     isSuccess,
//     txError,
//     writeError,
//     txReceiptError,
//     updateMintStatus,
//   ]);

//   return {
//     mint,
//     handleToasts,
//     isBusy: isBusy || isPending || isConfirming,
//     mintPriceWei: mintPrice as bigint | undefined,
//     mintPriceHuman: mintPrice ? formatUnits(mintPrice as bigint, 18) : "0",
//     isPriceLoading,
//   };
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { toast } from "sonner";
import type { BaseError } from "wagmi";
import type { Abi } from "abitype";

import { getFilesByWallet, updateFile } from "@/actions/files";
import {
  nftABIArray as abi,
  nftAddress as contractAddress,
} from "@/lib/wagmi/contracts";
import { formatUnits, decodeEventLog, parseAbiItem } from "viem";

export function useMintContract() {
  const { address, isConnected } = useAccount();
  const toastIdRef = useRef<string | number | null>(null);

  const resolveRef = useRef<
    ((v: { success: boolean; tokenId?: bigint }) => void) | null
  >(null);
  const rejectRef = useRef<(() => void) | null>(null);

  const mintedUrisRef = useRef<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const {
    data: mintPrice,
    isLoading: isPriceLoading,
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "MINT_PRICE",
  });

  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending,
  } = useWriteContract();

  const {
    data: receipt,
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
    [address],
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
    }): Promise<{ success: boolean; tokenId?: bigint }> => {
      if (!isConnected) {
        toast.error("Connect your wallet first");
        return { success: false };
      }

      const urisArray = Array.isArray(tokenURIs) ? tokenURIs : [tokenURIs];

      if (!urisArray.length) {
        toast.error("No token URI provided");
        return { success: false };
      }

      if (!mintPrice) {
        toast.error("Mint price not loaded yet");
        return { success: false };
      }

      mintedUrisRef.current = urisArray;
      setIsBusy(true);

      return new Promise((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;

        try {
          writeContract({
            address: contractAddress,
            abi,
            functionName: isBatch ? "batchMint" : "mint",
            args: isBatch
              ? [urisArray[0], quantity, royaltyBps]
              : [urisArray[0], royaltyBps],
            value: isBatch
              ? (mintPrice as bigint) * BigInt(quantity)
              : (mintPrice as bigint),
          });
        } catch (err) {
          console.error(err);
          setIsBusy(false);
          reject();
        }
      });
    },
    [abi, contractAddress, isConnected, writeContract, mintPrice],
  );

  /* ----------------------------------------
     Transaction lifecycle + Token ID extract
  ---------------------------------------- */
  const handleToasts = useCallback(() => {
    // Write error
    if (writeError) {
      const msg =
        (writeError as BaseError).shortMessage || writeError.message;

      toast.error(
        msg.includes("insufficient funds")
          ? "Not enough APOLLO ⛽"
          : msg,
      );

      rejectRef.current?.();
      resolveRef.current = null;
      rejectRef.current = null;
      setIsBusy(false);
    }

    // Pending
    if (isConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Transaction in progress...");
    }

    // Success
    if (isSuccess && receipt) {
      fetch("/api/sync-mints").catch(() => {});

      let tokenId: bigint | undefined;

      try {
        const transferEvent = parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
        );

        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: [transferEvent],
              data: log.data,
              topics: log.topics,
            });

            const isMint =
              decoded.args.from ===
              "0x0000000000000000000000000000000000000000";

            const isToUser =
              decoded.args.to?.toLowerCase() ===
              address?.toLowerCase();

            if (isMint && isToUser) {
              tokenId = decoded.args.tokenId as bigint;
              break;
            }
          } catch {
            continue;
          }
        }
      } catch (err) {
        console.error("Error decoding tokenId:", err);
      }

      toast.success("NFT minted successfully 🎉", {
        id: toastIdRef.current ?? undefined,
      });

      if (mintedUrisRef.current.length) {
        updateMintStatus(mintedUrisRef.current);
      }

      resolveRef.current?.({
        success: true,
        tokenId,
      });

      resolveRef.current = null;
      rejectRef.current = null;
      toastIdRef.current = null;
      setIsBusy(false);
    }

    // Failure
    if (txError && toastIdRef.current) {
      const msg =
        (txReceiptError as BaseError)?.shortMessage ||
        txReceiptError?.message ||
        "Transaction failed";

      toast.error(msg, {
        id: toastIdRef.current,
      });

      rejectRef.current?.();
      resolveRef.current = null;
      rejectRef.current = null;

      toastIdRef.current = null;
      setIsBusy(false);
    }
  }, [
    isConfirming,
    isSuccess,
    txError,
    writeError,
    txReceiptError,
    receipt,
    address,
    updateMintStatus,
  ]);

  return {
    mint,
    handleToasts,
    isBusy: isBusy || isPending || isConfirming,
    mintPriceWei: mintPrice as bigint | undefined,
    mintPriceHuman: mintPrice
      ? formatUnits(mintPrice as bigint, 18)
      : "0",
    isPriceLoading,
  };
}
