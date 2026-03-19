"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const latestSyncKeyRef = useRef<string | null>(null);

  // Form State
  const [formValues, setFormValues] = useState<MintFormValues>({
    name: "",
    title: "",
    description: "",
    coverImageUrl: undefined,
    musicTrackUrl: "",
    fileType: undefined,
    trailerUrl: undefined,
    trailerFileType: undefined,
    royaltyBps: Number(getRoyalty("SINGLE")) || 500,
    mainFileSelected: false,
    mainUploadInProgress: false,
  });

  // Mint States
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | undefined>(undefined);
  const [mintedTokenUri, setMintedTokenUri] = useState<string | undefined>(undefined);

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
      trailerUrl: undefined,
      trailerFileType: undefined,
      royaltyBps: 500,
      mainFileSelected: false,
      mainUploadInProgress: false,
    });
    removeRoyalty("SINGLE");
    toast.success("Form reset");
  };

  const registerMintState = useCallback(
    async (tokenId: number, tokenUri: string) => {
      if (!address) return;

      const payload = {
        tokenId,
        walletAddress: address,
        tokenUri,
        name: formValues.name,
        title: formValues.title,
        description: formValues.description,
        coverImageUrl: formValues.coverImageUrl,
        musicTrackUrl: formValues.musicTrackUrl,
        fileType: formValues.fileType,
        trailerUrl: formValues.trailerUrl,
        trailerFileType: formValues.trailerFileType,
        royaltyBps: formValues.royaltyBps,
        mainFileId: formValues.mainFileId,
        coverFileId: formValues.coverFileId,
        trailerFileId: formValues.trailerFileId,
      };

      const syncKey = JSON.stringify(payload);
      if (latestSyncKeyRef.current === syncKey) {
        return;
      }

      const registerRes = await fetch("/api/mint/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: syncKey,
      });

      if (!registerRes.ok) {
        const error = await registerRes.text();
        throw new Error(error || "Failed to sync mint state");
      }

      latestSyncKeyRef.current = syncKey;
    },
    [
      address,
      formValues.coverImageUrl,
      formValues.description,
      formValues.fileType,
      formValues.musicTrackUrl,
      formValues.name,
      formValues.royaltyBps,
      formValues.title,
      formValues.trailerFileType,
      formValues.trailerUrl,
    ]
  );

  // Handle mint
  const handleMint = async () => {
    if (!formValues.mainFileId) {
      toast.error("Please select a file to continue");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsMinting(true);

    try {
      // tokenURI points to our mutable metadata API — no IPFS pinning needed upfront.
      // Once the TUS upload finishes, the endpoint automatically returns the real IPFS URLs.
      const tokenURI = `${window.location.origin}/api/nft/metadata/file/${formValues.mainFileId}`;

      const { success, tokenId } = await mint({
        tokenURI,
        royaltyBps: formValues.royaltyBps,
      });

      if (success) {
        const tokenIdNumber = Number(tokenId);
        if (Number.isFinite(tokenIdNumber)) {
          await registerMintState(tokenIdNumber, tokenURI);
        }

        setMintedTokenId(tokenIdNumber);
        setMintedTokenUri(tokenURI);
        setTimeout(() => {
          setShowSuccess(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Mint error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  useEffect(() => {
    if (!mintedTokenId || !Number.isFinite(mintedTokenId)) {
      return;
    }

    if (!formValues.musicTrackUrl && !formValues.coverImageUrl && !formValues.trailerUrl) {
      return;
    }

    registerMintState(mintedTokenId, mintedTokenUri || `ipfs://pending-${mintedTokenId}`).catch((error) => {
      console.error("Mint state sync error:", error);
    });
  }, [
    formValues.coverImageUrl,
    formValues.musicTrackUrl,
    formValues.trailerUrl,
    mintedTokenId,
    mintedTokenUri,
    registerMintState,
  ]);

useEffect(() => {
  handleToasts();
}, [handleToasts]); // or [] if handleToasts is stable

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
                !formValues.mainFileId ||
                isPriceLoading ||
                isBusy ||
                isMinting ||
                !address
              }
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl  shadow-lg disabled:opacity-80 disabled:cursor-not-allowed! transition-all"
            >
              {isBusy || isMinting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin " />
                  Minting...
                </span>
              ) : !address ? (
                "Connect Wallet"
              ) : formValues.mainUploadInProgress ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mint NFT (uploading...)
                </span>
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
          setMintedTokenUri(undefined);
          latestSyncKeyRef.current = null;
          handleReset();
        }}
        tokenId={mintedTokenId}
      />
    </div>
  );
}
