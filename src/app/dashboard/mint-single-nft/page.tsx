"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import FileSelectInput from "@/components/ui/FileSelectInput";
import { Button } from "@/components/ui/button";
import { useMintContract } from "@/hooks/useMint";
import Image from "next/image";
import {nftABIArray,nftAddress} from "@/lib/wagmi/contracts";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export default function MintSingleNFTPage() {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [royaltyBps, setRoyaltyBps] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);

  // Replace with your contract address and ABI
  const abi = nftABIArray;
  const { mint, handleToasts, isBusy } = useMintContract({ contractAddress:nftAddress, abi });

  // Update preview when file changes
  const handleFileChange = (ipfsUrl: string) => {
    setSelectedFile(ipfsUrl);
    setPreviewUrl(ipfsUrl ? `${PINATA_GATEWAY}${ipfsUrl.replace(/^ipfs\//, "")}` : "");
  };

  const handleRoyaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoyaltyBps(Number(e.target.value));
  };

  const handleMint = async () => {
    if (!selectedFile) return;
    setIsMinting(true);
    await mint({ tokenURIs: selectedFile, royaltyBps });
    setIsMinting(false);
  };

  handleToasts();

  return (
    <div className="max-w-xl mx-auto mt-10 bg-card rounded-xl shadow-lg p-8 flex flex-col gap-8 border border-border">
      <h1 className="text-2xl font-bold text-primary mb-2">Mint Single NFT</h1>
      <div className="flex flex-col gap-4">
        <label className="font-medium text-muted-foreground">Select File</label>
        <FileSelectInput
          walletId={address || ""}
          onChange={handleFileChange}
          className="w-full"
        />
        {previewUrl && (
          <div className="mt-4 flex justify-center">
            <Image
              src={previewUrl}
              alt="Preview"
              width={320}
              height={320}
              className="rounded-lg border border-border object-contain bg-muted"
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="royalty" className="font-medium text-muted-foreground flex justify-between">
          Royalty: <span className="text-primary font-semibold">{royaltyBps}%</span>
        </label>
        <input
          id="royalty"
          type="range"
          min={0}
          max={10}
          value={royaltyBps}
          onChange={handleRoyaltyChange}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>10%</span>
        </div>
      </div>
      <Button
        onClick={handleMint}
        disabled={!selectedFile || isMinting || isBusy}
        className="w-full mt-4"
        size="lg"
      >
        {isMinting || isBusy ? "Minting..." : "Mint NFT"}
      </Button>
    </div>
  );
}
