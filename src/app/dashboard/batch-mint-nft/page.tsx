"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import FileMultiSelectInput from "@/components/ui/FileMultiSelectInpt";
import { Button } from "@/components/ui/button";
import { useMintContract } from "@/hooks/useMint";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { SparklesIcon } from "lucide-react";

export default function BatchMintNFTPage() {
  const { address } = useAccount();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [royaltyBps, setRoyaltyBps] = useState(500); // Default 5%
  const [isMinting, setIsMinting] = useState(false);

  const { mint, handleToasts, isBusy } = useMintContract({
    contractAddress: nftAddress,
    abi: nftABIArray,
  });

  const handleFilesChange = (ipfsUrls: string[]) => {
    setSelectedFiles(ipfsUrls);
  };

  const handleMint = async () => {
    if (!selectedFiles.length) return;
    setIsMinting(true);
    await mint({ tokenURIs: selectedFiles, quantity: selectedFiles.length, royaltyBps, isBatch: true });
    setIsMinting(false);
  };

  handleToasts();

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 w-full">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white inline-block drop-shadow-lg">
          Batch Mint NFTs
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-300 max-w-2xl mx-auto">
          Select multiple files to mint NFTs in a single transaction. Set royalty and review quantity before minting. Estimated gas is shown below.
        </p>
      </div>
      <div className="rounded-2xl border p-8 shadow-xl flex flex-col gap-8 bg-white dark:bg-black">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-7 h-7 text-cyan-500 dark:text-cyan-300" />
          <h2 className="text-2xl font-bold text-black dark:text-white">Batch Mint NFTs</h2>
        </div>
        <FileMultiSelectInput walletId={address || ""} onChange={handleFilesChange} maxSelections={20} />
        <div className="flex flex-col gap-2">
          <label htmlFor="royalty-slider" className="font-medium text-sm flex justify-between">
            <span>Royalty Percentage</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-300">{(royaltyBps / 100).toFixed(2)}%</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="royalty-slider"
              type="range"
              min={0}
              max={1000}
              step={10}
              value={royaltyBps}
              onChange={e => setRoyaltyBps(Number(e.target.value))}
              className="w-full accent-cyan-500 h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
              style={{ boxShadow: '0 0 0 2px #06b6d4' }}
            />
            <span className="w-12 text-right text-xs text-gray-500 dark:text-gray-400">{royaltyBps} bps</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">Set the royalty for secondary sales (0-10%).</span>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <div className="w-full flex flex-col gap-1">
            <span className="text-sm font-medium text-black dark:text-white">NFTs to Mint: <span className="font-bold text-cyan-600 dark:text-cyan-300">{selectedFiles.length}</span> / 20</span>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-2 bg-cyan-400 dark:bg-cyan-600 transition-all duration-300"
                style={{ width: `${(selectedFiles.length / 20) * 100}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg bg-cyan-50 dark:bg-cyan-900/40 p-3 text-cyan-800 dark:text-cyan-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636"/></svg>
            Did you know? Batch minting saves you time and gas compared to minting one by one!
          </div>
        </div>
        <Button
          onClick={handleMint}
          disabled={!selectedFiles.length || isBusy || isMinting}
          className="mt-4 py-3 text-base font-semibold rounded-xl shadow-md bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 transition-all duration-200"
        >
          {isBusy || isMinting ? (
            <span className="flex items-center gap-2 animate-pulse">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Minting...
            </span>
          ) : "Batch Mint"}
        </Button>
      </div>
    </div>
  );
}
