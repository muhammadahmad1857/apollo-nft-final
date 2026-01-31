/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import FileSelectInput from "@/components/ui/FileSelectInput";
import { Button } from "@/components/ui/button";
import { useMintContract } from "@/hooks/useMint";
import Image from "next/image";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { SparklesIcon } from "lucide-react";

const PINATA_GATEWAY = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`;


export default function MintSingleNFTPage() {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = useState("");
  const [royaltyBps, setRoyaltyBps] = useState(500); // Default 5%
  const [previewUrl, setPreviewUrl] = useState("");
  const [metaName, setMetaName] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [metaJson, setMetaJson] = useState<any>(null);

  const { mint, handleToasts, isBusy } = useMintContract({
    contractAddress: nftAddress,
    abi: nftABIArray,
  });
 
  const handleFileChange =  useCallback(async (ipfsUrl: string) => {
    setSelectedFile(ipfsUrl);
    setPreviewUrl("");
    setMetaName("");
    setMetaDesc("");
    setMetaJson(null);

    if (!ipfsUrl) return;

    setIsLoadingPreview(true);
    try {
      const url = `${PINATA_GATEWAY}${ipfsUrl.replace("ipfs://", "")}`;
      const res = await fetch(url);
      console.log("Fetched metadata from:", url); 
      const meta = await res.json();
      console.log("Metadata:", meta);

      setMetaJson(meta);
      setMetaName(meta.name || "");
      setMetaDesc(meta.description || "");

      if (meta.image) {
        const imgUrl = meta.cover.startsWith("ipfs://")
          ? `${PINATA_GATEWAY}${meta.cover.replace("ipfs://", "")}`
          : meta.cover;
        setPreviewUrl(imgUrl);
      }
    } catch {
      setMetaJson(null);
      setPreviewUrl("");
    }
    setIsLoadingPreview(false);
  },[])

  const handleMint = async () => {
    if (!selectedFile) return;
    setIsMinting(true);
    await mint({ tokenURIs: selectedFile, royaltyBps });
    setIsMinting(false);
  };

  handleToasts();

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 w-full">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white inline-block drop-shadow-lg animate-fade-in">
          Mint NFTs
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-300 max-w-2xl mx-auto animate-fade-in delay-100">
          Effortlessly mint your unique NFT with custom metadata and royalty settings. Upload your file, preview your NFT, and set your royalty percentage with a sleek slider.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2  gap-10 items-start">
       

        {/* Form Section */}
        <div className="flex flex-col gap-8 w-full animate-fade-in delay-150">
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-7 h-7 text-cyan-500 dark:text-cyan-300 animate-sparkle" />
            <h2 className="text-2xl font-bold text-black dark:text-white">Mint Single NFT</h2>
          </div>
          <FileSelectInput walletId={address || ""} onChange={handleFileChange} fileExtensions={[".json"]} />

          {/* Royalty Slider */}
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

          <Button
            onClick={handleMint}
            disabled={!selectedFile || isBusy || isMinting}
            className="mt-4 py-3 text-base font-semibold rounded-xl shadow-md bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 transition-all duration-200 animate-fade-in delay-200"
            style={{ letterSpacing: 1 }}
          >
            {isBusy || isMinting ? (
              <span className="flex items-center gap-2 animate-pulse">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Minting...
              </span>
            ) : "Mint NFT"}
          </Button>
        </div>
         {/* Preview Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-full aspect-square max-w-xs relative border-2 border-cyan-400/60 dark:border-cyan-300/40 rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-black transition-all duration-300 animate-fade-in">
            {isLoadingPreview ? (
              <span className="flex items-center justify-center h-full w-full text-lg animate-pulse">Loading preview...</span>
            ) : previewUrl ? (
              <Image src={previewUrl} alt="preview" fill className="object-contain transition-transform duration-500 hover:scale-105" />
            ) : (
              <span className="flex items-center justify-center h-full w-full text-gray-400 dark:text-gray-600">No preview</span>
            )}
          </div>
          {metaJson && (
            <div className="w-full bg-gray-50 dark:bg-gray-900/60 rounded-xl p-4 border border-cyan-100 dark:border-cyan-900 text-left animate-fade-in delay-200">
              <JsonWithIpfsImages data={metaJson} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================
   Helper Components
======================= */

function JsonWithIpfsImages({ data }: { data: any }) {
  const [hoveredIpfs, setHoveredIpfs] = useState<string | null>(null);

  function renderJson(val: any): React.ReactNode {
    if (typeof val !== "object" || val === null) {
      if (typeof val === "string" && isIpfsUrl(val)) {
        const imgUrl = val.startsWith("ipfs://")
          ? `${PINATA_GATEWAY}${val.replace("ipfs://", "")}`
          : `${PINATA_GATEWAY}${val.replace(/^ipfs\//, "")}`;
        return (
          <span
            className="flex items-center gap-2 group cursor-pointer"
            onMouseEnter={() => setHoveredIpfs(imgUrl)}
            onMouseLeave={() => setHoveredIpfs(null)}
            style={{ position: "relative" }}
          >
            <span className="text-xs break-all underline decoration-dotted decoration-cyan-400/60 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
              {val}
            </span>
            <Image src={imgUrl} alt="ipfs" width={32} height={32} className="rounded shadow transition-transform duration-300 group-hover:scale-110" />
          </span>
        );
      }
      return <span className="text-xs">{JSON.stringify(val)}</span>;
    }
    if (Array.isArray(val)) {
      return (
        <div>
          {val.map((item, i) => (
            <div key={i}>{renderJson(item)}</div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-1">
        {Object.entries(val).map(([key, value]) => (
          <div key={key} className="flex items-start gap-1">
            <strong>{key}:</strong> {renderJson(value)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {hoveredIpfs && (
        <div className="mb-4 flex justify-center animate-fade-in-fast">
          <div className="rounded-xl border shadow-lg bg-white dark:bg-black p-2 max-w-xs transition-all duration-300 scale-100 opacity-100">
            <Image src={hoveredIpfs} alt="ipfs preview" width={200} height={200} className="object-contain rounded transition-transform duration-300" />
          </div>
        </div>
      )}
      <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto border border-cyan-100 dark:border-cyan-900 transition-colors duration-300">
        {renderJson(data)}
      </div>
    </div>
  );
}

function isIpfsUrl(val: string) {
  return val.startsWith("ipfs://") || val.startsWith("ipfs/");
}
