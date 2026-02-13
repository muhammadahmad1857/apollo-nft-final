"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { useMintContract } from "@/hooks/useMint";
import { saveRoyalty, getRoyalty, removeRoyalty } from "@/lib/royaltySessionStorage";
import MintSuccessDialog from "@/components/MintSuccess";
import { MintMetadataForm, type MintFormValues } from "@/components/mint/MintMetadataForm";
import { useUser } from "@/hooks/useUser";

export default function MintPage() {
  const { address } = useAccount();
  const { data: user } = useUser(address);
  const { mint, handleToasts, isBusy, isPriceLoading } =
    useMintContract();

  // Form State
  const [formValues, setFormValues] = useState<MintFormValues>({
    name: "",
    title: "",
    description: "",
    coverImageUrl: undefined,
    musicTrackUrl: "",
    fileType: undefined,
    royaltyBps: Number(getRoyalty("SINGLE")) || 500,
  });

  // Mint States
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | undefined>(undefined);

  // Update royalty in session storage
  useEffect(() => {
    saveRoyalty(formValues.royaltyBps, "SINGLE");
  }, [formValues.royaltyBps]);

  // Reset form
  const handleReset = () => {
    setFormValues({
      name: "",
      title: "",
      description: "",
      coverImageUrl: undefined,
      musicTrackUrl: "",
      fileType: undefined,
      royaltyBps: 500,
    });
    removeRoyalty("SINGLE");
    toast.success("Form reset");
  };

  // Handle mint
  const handleMint = async () => {
    if (!formValues.musicTrackUrl) {
      toast.error("Please upload a file to continue");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsMinting(true);

    try {
      // Create metadata JSON
      const metadata = {
        name: formValues.name,
        title: formValues.title,
        description: formValues.description,
        cover: formValues.coverImageUrl,
        media: formValues.musicTrackUrl,
        fileType: formValues.fileType,
      };

      // Upload metadata JSON to Pinata
      const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
      if (!jwtRes.ok) {
        throw new Error("Failed to get upload token");
      }
      const { JWT } = await jwtRes.json();

      const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const file = new File([blob], `${formValues.name || "nft"}-metadata.json`, { type: "application/json" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("network", "public");

      const uploadRes = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${JWT}`,
          },
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        const error = await uploadRes.text();
        throw new Error(error || "Metadata upload failed");
      }

      const uploadJson = await uploadRes.json();
      const metadataIpfsHash = uploadJson.IpfsHash;
      const metadataUrl = `ipfs://${metadataIpfsHash}`;

      // Mint with metadata URL as token URI
      const {success,tokenId} = await mint({
        tokenURIs: metadataUrl,
        royaltyBps: formValues.royaltyBps,
      });

      if (success) {
        // Wait for sync and fetch latest token
        setMintedTokenId(Number(tokenId));
        setTimeout(async () => {
        setShowSuccess(true);
        }, 1000);
        
        removeRoyalty("SINGLE");
        handleReset();
      }
    } catch (error) {
      console.error("Mint error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  handleToasts();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-300 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white">
              Create & Mint
            </h1>
            <SparklesIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-300 animate-pulse" />
          </div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your file, add metadata, and mint your unique NFT in seconds.
            No drafts—mint directly.
          </p>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Metadata Form */}
          <MintMetadataForm
            values={formValues}
            onChange={setFormValues}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl border-zinc-600/50 hover:bg-zinc-900/50 dark:hover:bg-zinc-800/50 transition-all"
            >
              Reset
            </Button>
            <Button
              onClick={handleMint}
              disabled={
                !formValues.musicTrackUrl ||
                formValues.musicTrackUrl.trim() === "" ||
                isPriceLoading ||
                isBusy ||
                isMinting ||
                !address
              }
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isBusy || isMinting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  Minting...
                </span>
              ) : !address ? (
                "Connect Wallet"
              ) : (
                "Mint NFT"
              )}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Success Dialog */}
      <MintSuccessDialog 
        open={showSuccess} 
        onClose={() => {
          setShowSuccess(false);
          setMintedTokenId(undefined);
        }}
        tokenId={mintedTokenId}
      />
    </div>
  );
}
