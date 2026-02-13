"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2, SparklesIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { useMintContract } from "@/hooks/useMint";
import { saveRoyalty, getRoyalty, removeRoyalty } from "@/lib/royaltySessionStorage";
import MintSuccessDialog from "@/components/MintSuccess";
import { MintMetadataForm, type MintFormValues } from "@/components/mint/MintMetadataForm";

export default function BatchMintPage() {
  const { address } = useAccount();
  const { mint, handleToasts, isBusy, isPriceLoading } =
    useMintContract();

  // Form States
  const [forms, setForms] = useState<MintFormValues[]>([
    {
      name: "",
      title: "",
      description: "",
      coverImageUrl: undefined,
      musicTrackUrl: "",
      fileType: undefined,
      royaltyBps: Number(getRoyalty("BATCH")) || 500,
    },
  ]);

  // Mint States
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update royalty in session storage for all forms
  useEffect(() => {
    const lastRoyalty = forms[forms.length - 1]?.royaltyBps || 500;
    saveRoyalty(lastRoyalty, "BATCH");
  }, [forms]);

  // Add new form
  const handleAddForm = () => {
    const lastForm = forms[forms.length - 1];
    const newForm: MintFormValues = {
      name: "",
      title: "",
      description: "",
      coverImageUrl: undefined,
      musicTrackUrl: "",
      fileType: undefined,
      royaltyBps: lastForm?.royaltyBps || 500,
    };
    setForms([...forms, newForm]);
  };

  // Remove form
  const handleRemoveForm = (index: number) => {
    if (forms.length === 1) {
      toast.error("You must have at least one NFT");
      return;
    }
    setForms(forms.filter((_, i) => i !== index));
  };

  // Update form
  const handleFormChange = (index: number, values: MintFormValues) => {
    const newForms = [...forms];
    newForms[index] = values;
    setForms(newForms);
  };

  // Reset all forms
  const handleReset = () => {
    setForms([
      {
        name: "",
        title: "",
        description: "",
        coverImageUrl: undefined,
        musicTrackUrl: "",
        fileType: undefined,
        royaltyBps: 500,
      },
    ]);
    removeRoyalty("BATCH");
    toast.success("All forms reset");
  };

  // Handle batch mint
  const handleMint = async () => {
    // Validate all forms have files
    const missingFiles = forms
      .map((f, i) => (!f.musicTrackUrl ? i + 1 : null))
      .filter((n) => n !== null);

    if (missingFiles.length > 0) {
      toast.error(`NFTs ${missingFiles.join(", ")} are missing files`);
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsMinting(true);

    try {
      const royaltyBps = forms[0]?.royaltyBps || 500;

      // Mint each NFT with metadata
      let successCount = 0;
      for (const form of forms) {
        try {
          // Create metadata JSON
          const metadata = {
            name: form.name,
            title: form.title,
            description: form.description,
            cover: form.coverImageUrl,
            music: form.musicTrackUrl,
            fileType: form.fileType,
          };

          // Upload metadata JSON to Pinata
          const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
          if (!jwtRes.ok) {
            throw new Error("Failed to get upload token");
          }
          const { JWT } = await jwtRes.json();

          const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
          const file = new File([blob], `${form.name || "nft"}-metadata.json`, { type: "application/json" });

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
            throw new Error("Metadata upload failed");
          }

          const uploadJson = await uploadRes.json();
          const metadataIpfsHash = uploadJson.IpfsHash;
          const metadataUrl = `ipfs://${metadataIpfsHash}`;

          // Mint with metadata URL
          const success = await mint({
            tokenURIs: metadataUrl,
            royaltyBps,
          });
          if (success) {
            successCount++;
          }
        } catch (error) {
          console.error("Error minting:", error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully minted ${successCount} out of ${forms.length} NFTs`);
        setShowSuccess(true);
        removeRoyalty("BATCH");
        handleReset();
      }
    } catch (error) {
      console.error("Batch mint error:", error);
      toast.error("Failed to mint NFTs");
    } finally {
      setIsMinting(false);
    }
  };

  handleToasts();

  const uploadingCount = forms.filter(
    (f) => !f.musicTrackUrl
  ).length;
  const isAllFilesUploaded = uploadingCount === 0;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-300 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white">
              Batch Mint
            </h1>
            <SparklesIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-300 animate-pulse" />
          </div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create and mint multiple NFTs at once. Add as many as you need.
          </p>
        </div>

        {/* Forms Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Progress Info */}
          <div className="relative">
            <div className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-500/5 backdrop-blur-lg p-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  NFTs Ready: {forms.length}
                </p>
                <p className="text-xs text-cyan-400/80 mt-1">
                  {isAllFilesUploaded
                    ? `All ${forms.length} files uploaded ✓`
                    : `${uploadingCount} file(s) remaining`}
                </p>
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                {isAllFilesUploaded ? "✓" : uploadingCount}
              </div>
            </div>
          </div>

          {/* Forms List */}
          <AnimatePresence mode="popLayout">
            {forms.map((form, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Form Number Badge */}
                  <div className="absolute -top-4 left-6 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-sm">
                      <span className="text-xs font-semibold text-cyan-300">
                        NFT #{index + 1}
                      </span>
                    </div>
                  </div>

                  <MintMetadataForm
                    values={form}
                    onChange={(newValues) => handleFormChange(index, newValues)}
                    onRemove={() => handleRemoveForm(index)}
                    showRemoveButton={forms.length > 1}
                    royaltyLabel={`Royalty (${index === 0 ? "Applied to All" : "Same as NFT #1"})`}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Form Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddForm}
            className="w-full py-4 rounded-xl border-2 border-dashed border-cyan-400/40 hover:border-cyan-400/60 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
            <span className="text-sm font-semibold text-cyan-400 group-hover:text-cyan-300">
              Add Another NFT
            </span>
          </motion.button>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-zinc-700/50">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl border-zinc-600/50 hover:bg-zinc-900/50 dark:hover:bg-zinc-800/50 transition-all"
            >
              Reset All
            </Button>
            <Button
              onClick={handleMint}
              disabled={
                !isAllFilesUploaded ||
                isPriceLoading ||
                isBusy ||
                isMinting ||
                !address
              }
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl bg-linear-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isBusy || isMinting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Minting {forms.length} NFTs...
                </span>
              ) : !address ? (
                "Connect Wallet"
              ) : (
                `Mint All ${forms.length} NFT${forms.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>

          {/* Utility Info */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Note: All NFTs will be minted with the royalty percentage from the first NFT
          </div>
        </motion.div>
      </div>

      {/* Success Dialog */}
      <MintSuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
}
