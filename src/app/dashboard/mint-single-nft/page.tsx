"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import FileSelectInput from "@/components/ui/FileSelectInput";
import { Button } from "@/components/ui/button";
import { useMintContract } from "@/hooks/useMint";
import Image from "next/image";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { SparklesIcon } from "lucide-react";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";


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

  const handleFileChange = async (ipfsUrl: string) => {
    setSelectedFile(ipfsUrl);
    setPreviewUrl("");
    setMetaName("");
    setMetaDesc("");
    setMetaJson(null);

    if (!ipfsUrl) return;

    setIsLoadingPreview(true);
    try {
      const url = `${PINATA_GATEWAY}${ipfsUrl.replace(/^ipfs\//, "")}`;
      const res = await fetch(url);
      const meta = await res.json();

      setMetaJson(meta);
      setMetaName(meta.name || "");
      setMetaDesc(meta.description || "");

      if (meta.image) {
        const imgUrl = meta.image.startsWith("ipfs://")
          ? `${PINATA_GATEWAY}${meta.image.replace("ipfs://", "")}`
          : meta.image;
        setPreviewUrl(imgUrl);
      }
    } catch {
      setMetaJson(null);
      setPreviewUrl("");
    }
    setIsLoadingPreview(false);
  };

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
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text inline-block drop-shadow-lg">
          Mint NFTs
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Effortlessly mint your unique NFT with custom metadata and royalty settings. Upload your file, preview your NFT, and set your royalty percentage with a sleek slider.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Preview Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-full aspect-square max-w-xs relative border-2 border-primary/30 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-white via-gray-50 to-gray-100">
            {isLoadingPreview ? (
              <span className="flex items-center justify-center h-full w-full text-lg animate-pulse">Loading preview...</span>
            ) : previewUrl ? (
              <Image src={previewUrl} alt="preview" fill className="object-contain" />
            ) : (
              <span className="flex items-center justify-center h-full w-full text-muted-foreground">No preview</span>
            )}
          </div>
          {metaJson && (
            <div className="w-full bg-muted/40 rounded-xl p-4 border text-left">
              <JsonWithIpfsImages data={metaJson} />
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="flex flex-col gap-8 w-full">
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-bold">Mint Single NFT</h2>
          </div>
          <FileSelectInput walletId={address || ""} onChange={handleFileChange} />

          {/* Royalty Slider */}
          <div className="flex flex-col gap-2">
            <label htmlFor="royalty-slider" className="font-medium text-sm flex justify-between">
              <span>Royalty Percentage</span>
              <span className="font-semibold text-primary">{(royaltyBps / 100).toFixed(2)}%</span>
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
                className="w-full accent-primary h-2 rounded-lg appearance-none bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <span className="w-12 text-right text-xs text-muted-foreground">{royaltyBps} bps</span>
            </div>
            <span className="text-xs text-muted-foreground">Set the royalty for secondary sales (0-10%).</span>
          </div>

          <Button
            onClick={handleMint}
            disabled={!selectedFile || isBusy || isMinting}
            className="mt-4 py-3 text-base font-semibold rounded-xl shadow-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transition-all"
          >
            {isBusy || isMinting ? "Minting..." : "Mint NFT"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   Helper Components
======================= */


import React, { useState } from "react";

function JsonWithIpfsImages({ data }: { data: any }) {
  const [hoveredIpfs, setHoveredIpfs] = useState<string | null>(null);

  // Helper to render JSON recursively with hover events
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
            <span className="text-xs break-all underline decoration-dotted decoration-primary/60 group-hover:text-primary transition-colors">
              {val}
            </span>
            <Image src={imgUrl} alt="ipfs" width={32} height={32} className="rounded shadow" />
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

  // If there is a hovered IPFS, show preview at the top
  return (
    <div className="relative">
      {hoveredIpfs && (
        <div className="mb-4 flex justify-center">
          <div className="rounded-xl border shadow-lg bg-white p-2 max-w-xs">
            <Image src={hoveredIpfs} alt="ipfs preview" width={200} height={200} className="object-contain rounded" />
          </div>
        </div>
      )}
      <div className="text-xs font-mono bg-muted/30 rounded p-2 overflow-x-auto border">
        {renderJson(data)}
      </div>
    </div>
  );
}

function isIpfsUrl(val: string) {
  return val.startsWith("ipfs://") || val.startsWith("ipfs/");
}
