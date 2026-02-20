"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Loader2, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MintSuccessDialog from "@/components/MintSuccess";
import { MintMetadataForm, type MintFormValues } from "@/components/mint/MintMetadataForm";
import { useMintContract } from "@/hooks/useMint";
import {
  saveRoyalty,
  getRoyalty,
  removeRoyalty,
} from "@/lib/royaltySessionStorage";

export default function BatchMintPage() {
  const { address } = useAccount();
  const { mint, handleToasts, isBusy, isPriceLoading, mintPriceHuman } =
    useMintContract();

  const [formValues, setFormValues] = useState<MintFormValues>({
    name: "",
    title: "",
    description: "",
    coverImageUrl: undefined,
    musicTrackUrl: "",
    fileType: undefined,
    royaltyBps: 500,
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [universalRoyaltyBps, setUniversalRoyaltyBps] = useState<number>(
    Number(getRoyalty("BATCH")) || 500,
  );
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    saveRoyalty(universalRoyaltyBps, "BATCH");
  }, [universalRoyaltyBps]);

  useEffect(() => {
    handleToasts();
  }, [handleToasts]);

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
    setQuantity(1);
    setQuantityInput("1");
    setUniversalRoyaltyBps(500);
    removeRoyalty("BATCH");
    toast.success("Form reset");
  };

  const handleQuantityChange = (value: string) => {
    setQuantityInput(value);
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed >= 1) {
      setQuantity(parsed);
    }
  };

  const handleMint = async () => {
    if (!formValues.musicTrackUrl) {
      toast.error("Please upload a file to continue");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Quantity must be a whole number greater than 0");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsMinting(true);

    try {
      const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
      if (!jwtRes.ok) {
        throw new Error("Failed to get upload token");
      }

      const { JWT } = await jwtRes.json();
      const metadataFileName = `${formValues.name || "nft"}-${formValues.title || "metadata"}-${Date.now()}.json`;

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
              name: formValues.name,
              title: formValues.title,
              description: formValues.description,
              cover: formValues.coverImageUrl,
              media: formValues.musicTrackUrl,
              fileType: formValues.fileType,
            },
          }),
        },
      );

      if (!uploadRes.ok) {
        throw new Error("Metadata upload failed");
      }

      const uploadJson = await uploadRes.json();
      const metadataIpfsHash = uploadJson.IpfsHash;
      const metadataUrl = `ipfs://${metadataIpfsHash}`;

      const result = await mint({
        tokenURI: metadataUrl,
        quantity,
        royaltyBps: universalRoyaltyBps,
      });

      if (result.success) {
        toast.success(`Successfully minted ${quantity} NFT${quantity !== 1 ? "s" : ""} 🎉`);
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

  const hasValidQuantity = Number.isInteger(quantity) && quantity >= 1;
  const isQuantityInputValid =
    /^\d+$/.test(quantityInput) && Number(quantityInput) >= 1;
  const totalPriceHuman =
    !isPriceLoading && hasValidQuantity
      ? (Number(mintPriceHuman) * quantity).toFixed(4)
      : "0";

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white">
              Batch Mint
            </h1>
            <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create one metadata record and mint multiple copies by setting your quantity.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <MintMetadataForm
            values={formValues}
            onChange={setFormValues}
            showRoyalty={false}
          />

          <div className="space-y-2 rounded-xl backdrop-blur-md bg-zinc-500/5 border border-zinc-400/20 p-4">
            <label htmlFor="batch-quantity" className="text-sm font-semibold text-white">
              Quantity
            </label>
            <Input
              id="batch-quantity"
              type="number"
              min={1}
              step={1}
              value={quantityInput}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="h-11"
              placeholder="Enter quantity"
            />
            {!isQuantityInputValid && (
              <p className="text-xs text-red-300">Enter a whole number greater than 0.</p>
            )}
          </div>

          <div className="space-y-3 rounded-xl backdrop-blur-md bg-zinc-500/5 border border-zinc-400/20 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white">
                Royalty Percentage (Applied to All Copies)
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
              This royalty rate applies to all minted copies (0-10%).
            </p>
          </div>

          <div className="rounded-xl border border-zinc-400/20 bg-zinc-500/5 p-4 text-sm">
            <p className="text-white font-semibold">Mint summary</p>
            <p className="text-white/80 mt-1">Quantity: {hasValidQuantity ? quantity : 0}</p>
            <p className="text-white/80">
              Estimated total: {isPriceLoading ? "..." : `${totalPriceHuman} APOLLO`}
            </p>
            <p className="text-xs text-zinc-300 mt-2">
              One metadata URI will be reused for all copies in this transaction.
            </p>
          </div>

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
                !isQuantityInputValid ||
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
                  Minting {hasValidQuantity ? quantity : 0} NFT{quantity !== 1 ? "s" : ""}...
                </span>
              ) : !address ? (
                "Connect Wallet"
              ) : (
                `Mint ${hasValidQuantity ? quantity : 0} NFT${quantity !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>

          {/*
            Legacy multi-form batch mint flow (kept as requested for reference):
            - Previously used `forms: MintFormValues[]`
            - Supported Add/Remove/Collapse per-NFT metadata forms
            - Uploaded multiple metadata JSON files and called mint with token URI array
            - Replaced with single metadata + user-defined quantity
          */}
        </motion.div>
      </div>

      <MintSuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
}
