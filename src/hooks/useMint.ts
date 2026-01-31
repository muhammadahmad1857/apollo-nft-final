/* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useRef, useCallback } from "react";
// import {
//   useAccount,
//   useWriteContract,
//   useWaitForTransactionReceipt,
// } from "wagmi";
// import { toast } from "sonner";
// import type { BaseError } from "wagmi";
// import type { Abi } from "abitype";

// import { getFilesByWallet, updateFile } from "@/actions/files";

// interface UseMintContractProps {
//   contractAddress: `0x${string}`;
//   abi: Abi;
// }

// export function useMintContract({
//   contractAddress,
//   abi,
// }: UseMintContractProps) {
//   const { address, isConnected } = useAccount();
//   const toastIdRef = useRef<string | number | null>(null);

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
//     [address]
//   );

//   /* ----------------------------------------
//      Mint function
//   ---------------------------------------- */
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
//     }) => {
//       if (!isConnected) {
//         toast.error("Connect your wallet first");
//         return;
//       }

//       const urisArray = Array.isArray(tokenURIs)
//         ? tokenURIs
//         : [tokenURIs];

//       if (!urisArray.length) {
//         toast.error("No token URI provided");
//         return;
//       }

//       // Store URIs so we can update DB after success
//       mintedUrisRef.current = urisArray;

//       setIsBusy(true);

//       try {
//         writeContract({
//           address: contractAddress,
//           abi,
//           functionName: isBatch ? "batchMint" : "mint",
//           args: isBatch
//             ? [urisArray[0], quantity, royaltyBps]
//             : [urisArray[0], royaltyBps],
//           value: !isBatch ? BigInt(0.1 * 1e18):BigInt(0.1 * 1e18) * BigInt(quantity),
//         });
//       } catch (err) {
//         console.error(err);
//         setIsBusy(false);
//       }
//     },
//     [abi, contractAddress, isConnected, writeContract]
//   );

//   /* ----------------------------------------
//      Toast + transaction lifecycle
//   ---------------------------------------- */
//   const handleToasts = useCallback(() => {
//     // Write error (before tx submission)
//     if (writeError) {
//       const msg =
//         (writeError as BaseError).shortMessage ||
//         writeError.message;
//       toast.error(
//         msg.includes("insufficient funds")
//           ? "Not enough ETH ⛽"
//           : msg
//       );
//     }

//     // Tx pending
//     if (isConfirming && !toastIdRef.current) {
//       toastIdRef.current = toast.loading(
//         "Transaction in progress..."
//       );
//     }

//     // Tx success
//     if (isSuccess && toastIdRef.current) {
//       fetch('/api/sync-mints', {
//       method: 'GET',
//       // headers: {
//       //   'x-sync-secret': process.env.NEXT_PUBLIC_SYNC_SECRET || 'dev-secret' // use public for simplicity or env
//       // }
//     }).catch(() => {});
//       toast.success("NFT minted successfully 🎉", {
//         id: toastIdRef.current,
//       });

//       if (mintedUrisRef.current.length) {
//         updateMintStatus(mintedUrisRef.current);
//       }

//       toastIdRef.current = null;
//       setIsBusy(false);
//     }

//     // Tx failed
//     if (txError && toastIdRef.current) {
//       const msg =
//         (txReceiptError as BaseError)?.shortMessage ||
//         txReceiptError?.message;

//       toast.error(msg || "Transaction failed", {
//         id: toastIdRef.current,
//       });

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
//   };
// }

import { useState, useRef, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { toast } from "sonner";
import { parseAbiItem, type Abi } from "abitype";

import { getFilesByWallet, updateFile } from "@/actions/files";
import {
  nftAddress,
  nftABIArray,
  auctionAddress,
  marketplaceABIArray,
 
} from "@/lib/wagmi/contracts";
import { zeroAddress } from "viem";

interface MintArgs {
  tokenURIs: string | string[];
  quantity?: number;
  royaltyBps?: number;
  price: number;
  isBatch?: boolean;
}

export function useMintContract() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [isBusy, setIsBusy] = useState(false);
  const toastIdRef = useRef<string | number | null>(null);
  const mintedUrisRef = useRef<string[]>([]);
  const mintedTokenIdsRef = useRef<number[]>([]);

  const { writeContract, data: txHash, error: writeError, isPending } =
    useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: txError,
    error: txReceiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const {
    writeContract: approveForAllWrite,
    data: approveTx,
  } = useWriteContract();

  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveTx,
  });

  /* -------------------------------
     Update DB after mint
  ------------------------------- */
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

  /* -------------------------------
     Mint function
  ------------------------------- */
  const mint = useCallback(
    async ({ tokenURIs, quantity = 1, royaltyBps = 0, price, isBatch = false }: MintArgs) => {
      if (!isConnected) {
        toast.error("Connect wallet first");
        return;
      }

      const urisArray = Array.isArray(tokenURIs) ? tokenURIs : [tokenURIs];
      if (!urisArray.length) {
        toast.error("No token URI provided");
        return;
      }

      mintedUrisRef.current = urisArray;
      setIsBusy(true);

      try {
        writeContract({
          address: nftAddress,
          abi: nftABIArray,
          functionName: isBatch ? "batchMint" : "mint",
          args: isBatch ? [urisArray, quantity, royaltyBps] : [urisArray[0], royaltyBps],
          value: BigInt(price * 1e18) * BigInt(isBatch ? quantity : 1),
        });
      } catch (err) {
        console.error(err);
        setIsBusy(false);
      }
    },
    [isConnected, writeContract]
  );

  /* -------------------------------
     Toasts + auto approve + auto list
  ------------------------------- */
  const handleToasts = useCallback(async () => {
    // Mint write error
    if (writeError) {
      const msg = (writeError as any)?.shortMessage || writeError.message;
      toast.error(msg.includes("insufficient funds") ? "Not enough ETH ⛽" : msg);
    }

    // Pending
    if (isConfirming && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Transaction in progress...");
    }

    // Success
    if (isSuccess && toastIdRef.current && address) {
      try {
        // 1️⃣ Get minted tokenIds from Transfer logs
        const logs = await publicClient?.getLogs({
          address: nftAddress,
          event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
          fromBlock: "latest", // can replace with last synced block for efficiency
          toBlock: "latest",
          args: { from: zeroAddress, to: address },
        });
        if(!logs ) return
        const mintedTokenIds = logs.map(l => Number(l.args.tokenId));
        mintedTokenIdsRef.current = mintedTokenIds;

        // 2️⃣ Auto approve
        const approved = await publicClient?.readContract({
          address: nftAddress,
          abi: nftABIArray,
          functionName: "isApprovedForAll",
          args: [address, auctionAddress],
        });

        if (!approved) {
          await approveForAllWrite({
            address: nftAddress,
            abi: nftABIArray,
            functionName: "setApprovalForAll",
            args: [auctionAddress, true],
          });
          // wait for approveSuccess
          while (!approveSuccess) await new Promise(r => setTimeout(r, 1000));
        }

        // 3️⃣ Auto list each minted token
        for (const tokenId of mintedTokenIdsRef.current) {
          await writeContract({
            address: auctionAddress,
            abi: marketplaceABIArray,
            functionName: "list",
            args: [BigInt(tokenId), BigInt(0.1 * 1e18)], // replace 0.1 with real price if passed
          });
        }

        // 4️⃣ Update DB
        if (mintedUrisRef.current.length) await updateMintStatus(mintedUrisRef.current);

        fetch("/api/sync-mints").catch(() => {});

        toast.success("NFT minted, approved & listed 🚀", { id: toastIdRef.current });
      } catch (err) {
        console.error("Auto approve/list failed", err);
        toast.error("Auto approve/list failed", { id: toastIdRef.current });
      } finally {
        toastIdRef.current = null;
        setIsBusy(false);
      }
    }

    // Tx failed
    if (txError && toastIdRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (txReceiptError as any)?.shortMessage || txReceiptError?.message;
      toast.error(msg || "Transaction failed", { id: toastIdRef.current });
      toastIdRef.current = null;
      setIsBusy(false);
    }
  }, [
    isConfirming,
    isSuccess,
    txError,
    writeError,
    txReceiptError,
    publicClient,
    approveForAllWrite,
    approveSuccess,
    writeContract,
    address,
    updateMintStatus,
  ]);

  return {
    mint,
    handleToasts,
    isBusy: isBusy || isPending || isConfirming,
  };
}
