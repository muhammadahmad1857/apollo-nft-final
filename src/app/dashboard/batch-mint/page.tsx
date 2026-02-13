"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2, SparklesIcon, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useMintContract } from "@/hooks/useMint";
import { saveRoyalty, getRoyalty, removeRoyalty } from "@/lib/royaltySessionStorage";
import MintSuccessDialog from "@/components/MintSuccess";
import { MintMetadataForm, type MintFormValues } from "@/components/mint/MintMetadataForm";

// Generate unique ID for each form
const generateFormId = () => `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function BatchMintPage() {
  const { address } = useAccount();
  const { mint, handleToasts, isBusy, isPriceLoading } =
    useMintContract();

  // Form States
  const [forms, setForms] = useState<MintFormValues[]>([
    {
      id: generateFormId(),
      name: "",
      title: "",
      description: "",
      coverImageUrl: undefined,
      musicTrackUrl: "",
      fileType: undefined,
      royaltyBps: 500,
    },
  ]);

  // Universal Royalty State
  const [universalRoyaltyBps, setUniversalRoyaltyBps] = useState<number>(
    Number(getRoyalty("BATCH")) || 500
  );

  // Collapse State
  const [collapsedForms, setCollapsedForms] = useState<Set<string>>(new Set());

  // Mint States
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update royalty in session storage
  useEffect(() => {
    saveRoyalty(universalRoyaltyBps, "BATCH");
  }, [universalRoyaltyBps]);

  // Add new form
  const handleAddForm = () => {
    const newForm: MintFormValues = {
      id: generateFormId(),
      name: "",
      title: "",
      description: "",
      coverImageUrl: undefined,
      musicTrackUrl: "",
      fileType: undefined,
      royaltyBps: 500,
    };
setForms(prev => [...prev, newForm]);
  };

  // Remove form
  const handleRemoveForm = (formId: string) => {
    if (forms.length === 1) {
      toast.error("You must have at least one NFT");
      return;
    }
setForms(prev => prev.filter(form => form.id !== formId));
    setCollapsedForms((prev) => {
      const updated = new Set(prev);
      updated.delete(formId);
      return updated;
    });
  };

  // Toggle collapse
  const toggleCollapse = (formId: string) => {
    setCollapsedForms((prev) => {
      const updated = new Set(prev);
      if (updated.has(formId)) {
        updated.delete(formId);
      } else {
        updated.add(formId);
      }
      return updated;
    });
  };

const handleFormChange = (
  formId: string,
  values: MintFormValues | ((prev: MintFormValues) => MintFormValues)
) => {
  setForms(prevForms =>
    prevForms.map(form => {
      if (form.id !== formId) return form;

      const resolved =
        typeof values === "function" ? values(form) : values;

      return { ...resolved, id: formId };
    })
  );
};


  // Reset all forms
  const handleReset = () => {
    setForms([
      {
        id: generateFormId(),
        name: "",
        title: "",
        description: "",
        coverImageUrl: undefined,
        musicTrackUrl: "",
        fileType: undefined,
        royaltyBps: 500,
      },
    ]);
    setUniversalRoyaltyBps(500);
    removeRoyalty("BATCH");
    toast.success("All forms reset");
  };

  // Handle batch mint
  // const handleMint = async () => {
  //   // Validate all forms have files
  //   const missingFiles = forms
  //     .map((f, i) => (!f.musicTrackUrl ? i + 1 : null))
  //     .filter((n) => n !== null);

  //   if (missingFiles.length > 0) {
  //     toast.error(`NFTs ${missingFiles.join(", ")} are missing files`);
  //     return;
  //   }

  //   if (!address) {
  //     toast.error("Please connect your wallet");
  //     return;
  //   }

  //   setIsMinting(true);

  //   try {
  //     const royaltyBps = forms[0]?.royaltyBps || 500;

  //     // Mint each NFT with metadata
  //     let successCount = 0;
  //     for (const form of forms) {
  //       try {
  //         // Create metadata JSON
  //         const metadata = {
  //           name: form.name,
  //           title: form.title,
  //           description: form.description,
  //           cover: form.coverImageUrl,
  //           media: form.musicTrackUrl,
  //           fileType: form.fileType,
  //         };

  //         // Upload metadata JSON to Pinata
  //         const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
  //         if (!jwtRes.ok) {
  //           throw new Error("Failed to get upload token");
  //         }
  //         const { JWT } = await jwtRes.json();

  //         const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
  //         const file = new File([blob], `${form.name || "nft"}-metadata.json`, { type: "application/json" });

  //         const formData = new FormData();
  //         formData.append("file", file);
  //         formData.append("network", "public");

  //         const uploadRes = await fetch(
  //           "https://api.pinata.cloud/pinning/pinFileToIPFS",
  //           {
  //             method: "POST",
  //             headers: {
  //               Authorization: `Bearer ${JWT}`,
  //             },
  //             body: formData,
  //           }
  //         );

  //         if (!uploadRes.ok) {
  //           throw new Error("Metadata upload failed");
  //         }

  //         const uploadJson = await uploadRes.json();
  //         const metadataIpfsHash = uploadJson.IpfsHash;
  //         const metadataUrl = `ipfs://${metadataIpfsHash}`;

  //         // Mint with metadata URL
  //         const success = await mint({
  //           tokenURIs: metadataUrl,
  //           royaltyBps,
  //         });
  //         if (success) {
  //           successCount++;
  //         }
  //       } catch (error) {
  //         console.error("Error minting:", error);
  //       }
  //     }

  //     if (successCount > 0) {
  //       toast.success(`Successfully minted ${successCount} out of ${forms.length} NFTs`);
  //       setShowSuccess(true);
  //       removeRoyalty("BATCH");
  //       handleReset();
  //     }
  //   } catch (error) {
  //     console.error("Batch mint error:", error);
  //     toast.error("Failed to mint NFTs");
  //   } finally {
  //     setIsMinting(false);
  //   }
  // };
const handleMint = async () => {
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
    const royaltyBps = universalRoyaltyBps;

    // 1️⃣ Upload ALL metadata first
    const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
    if (!jwtRes.ok) throw new Error("Failed to get upload token");

    const { JWT } = await jwtRes.json();

    const metadataUrls: string[] = [];

    for (const form of forms) {
      // const formData = new FormData();
      // formData.append("name", form.name || "");
      // formData.append("title", form.title || "");
      // formData.append("description", form.description || "");
      // formData.append("cover", form.coverImageUrl || "");
      // formData.append("media", form.musicTrackUrl || "");
      // formData.append("fileType", form.fileType || "");
      // formData.append("network", "public");
      const metadataFileName = `${form.name}-${form.title}-${new Date().getTime()}.json`;

      const uploadRes = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${JWT}`,
            "Content-Type": "application/json",
          },
          
          body: JSON.stringify({
            pinataMetadata: {
              name: metadataFileName,
            },
            pinataContent: {
              name: form.name,
              title: form.title,
              description: form.description,
              cover: form.coverImageUrl,
              media: form.musicTrackUrl,
              fileType: form.fileType,
              
            },
          }),
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Metadata upload failed");
      }

      const uploadJson = await uploadRes.json();
      const metadataIpfsHash = uploadJson.IpfsHash;

      metadataUrls.push(`ipfs://${metadataIpfsHash}`);
    }

    // 2️⃣ Now call ONE batch mint
    const result = await mint({
      tokenURIs: metadataUrls,
      quantity: metadataUrls.length,
      royaltyBps,
      isBatch: true,
    });

    if (result.success) {
      toast.success(`Successfully minted ${metadataUrls.length} NFTs 🎉`);
      setShowSuccess(true);
      removeRoyalty("BATCH");
      handleReset();
    } else {
      toast.error("Batch mint failed");
    }
  } catch (error) {
    console.error("Batch mint error:", error);
    toast.error("Failed to mint NFTs");
  } finally {
    setIsMinting(false);
  }
};

useEffect(() => {
  handleToasts();
}, [handleToasts]); // or [] if handleToasts is stable

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
            <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white">
              Batch Mint
            </h1>
            <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
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
            <div className="flex items-center gap-3 rounded-xl border border-zinc-400/20 bg-zinc-500/5 backdrop-blur-lg p-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  NFTs Ready: {forms.length}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  {isAllFilesUploaded
                    ? `All ${forms.length} files uploaded ✓`
                    : `${uploadingCount} file(s) remaining`}
                </p>
              </div>
              <div className="text-3xl font-bold text-white">
                {isAllFilesUploaded ? "✓" : uploadingCount}
              </div>
            </div>
          </div>

          {/* Forms List */}
          <AnimatePresence mode="popLayout">
            {forms.map((form, index) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {/* Form Header with Collapse */}
                  <motion.button
                    onClick={() => toggleCollapse(form.id!)}
                    className="w-full relative flex items-center justify-between -top-4 left-0 z-10 px-6 py-3 bg-linear-to-r from-zinc-500/30 to-zinc-600/20 hover:from-zinc-500/40 hover:to-zinc-600/30 border border-zinc-400/40 rounded-full backdrop-blur-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">
                        NFT #{index + 1}
                      </span>
                      {form.title && (
                        <span className="text-xs text-white/70">
                          {form.title}
                        </span>
                      )}
                      {form.musicTrackUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/40">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-xs text-green-300 font-semibold">
                            Ready
                          </span>
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: collapsedForms.has(form.id!) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {collapsedForms.has(form.id!) ? (
                        <ChevronUp className="w-5 h-5 text-white" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white" />
                      )}
                    </motion.div>
                  </motion.button>

                  {/* Form Content - Collapsible */}
                  <AnimatePresence>
                    {!collapsedForms.has(form.id!) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <MintMetadataForm
                          values={form}
                         onChange={(newValues) => {
    handleFormChange(form.id!, newValues);
  }}
                          onRemove={() => handleRemoveForm(form.id!)}
                          showRemoveButton={forms.length > 1}
                          showRoyalty={false}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Form Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddForm}
            className="w-full py-4 rounded-xl border-2 border-dashed border-zinc-400/60 hover:border-zinc-300 bg-linear-to-r from-zinc-500/20 to-zinc-600/10 hover:from-zinc-500/30 hover:to-zinc-600/20 shadow-lg hover:shadow-zinc-500/20 transition-all flex items-center justify-center gap-3 group backdrop-blur-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-500/30 group-hover:bg-zinc-500/40 transition-all">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white group-hover:text-gray-200">
                Add Another NFT
              </p>
              <p className="text-xs text-white/60">
                Click to create more NFTs
              </p>
            </div>
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
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl shadow-lg disabled:opacity-80 disabled:cursor-not-allowed! transition-all"
            >
              {isBusy || isMinting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin " />
                  Minting {forms.length} NFTs...
                </span>
              ) : !address ? (
                "Connect Wallet"
              ) : (
                `Mint All ${forms.length} NFT${forms.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
  {/* Royalty Section */}
          <div className="space-y-3 rounded-xl backdrop-blur-md bg-zinc-500/5 border border-zinc-400/20 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white">
                Royalty Percentage (Applied to All NFTs)
              </label>
              <span className="text-base font-bold text-white">
                {(universalRoyaltyBps / 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={universalRoyaltyBps}
                onChange={(e) => setUniversalRoyaltyBps(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none bg-linear-to-r from-zinc-500/30 to-zinc-500/50 accent-white cursor-pointer"
              />
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 w-12 text-right">
                {universalRoyaltyBps} bps
              </span>
            </div>
            <p className="text-xs text-white/80">
              This royalty rate will apply to all NFTs in this batch (0-10%)
            </p>
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
