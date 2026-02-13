"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";
import { useListNFT } from "@/hooks/useMarketplace";
import { ApproveMarketButton } from "@/components/marketplace/marketplaceApproveButton";
import { getNFTByTokenId } from "@/actions/nft";
import { useUpdateNFT } from "@/hooks/useNft";
import { NFTModel } from "@/generated/prisma/models";

export default function ListMarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = Number(params.tokenid);
  const { address } = useAccount();
  const { data: user } = useUser(address || "");

  const [currentStep, setCurrentStep] = useState(1);
  const [nft, setNft] = useState<NFTModel | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [priceEth, setPriceEth] = useState("");

  const { listNFT } = useListNFT();
  const updateNFT = useUpdateNFT();
  const [isListing, setIsListing] = useState(false);

  // Fetch NFT data
  useEffect(() => {
    const fetchNFT = async () => {
      try {
        const data = await getNFTByTokenId(tokenId);
        if (data) {
          setNft(data);
          setIsApproved(data.approvedMarket);
          if (data.approvedMarket) {
            setCurrentStep(2);
          }
          if (data.mintPrice) {
            setPriceEth(data.mintPrice.toString());
          }
        } else {
          toast.error("NFT not found");
          router.push("/dashboard");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch NFT");
        router.push("/dashboard");
      }
    };

    if (tokenId) {
      fetchNFT();
    }
  }, [tokenId, router]);

  const handleListNFT = async () => {
    if (!nft) return toast.error("NFT not found");
    if (!priceEth || Number(priceEth) <= 0) return toast.error("Please enter a valid price");

    setIsListing(true);

    try {
      // List on blockchain
      await listNFT(BigInt(tokenId), priceEth);

      // Update database
      await updateNFT.mutateAsync({
        id: nft.id,
        data: {
          isListed: true,
          mintPrice: Number(priceEth),
        },
      });

      toast.success("NFT listed on marketplace! 🎉");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error((err as Error)?.message || "Failed to list NFT");
    } finally {
      setIsListing(false);
    }
  };

  if (!nft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Button
          variant="default"
          onClick={() => router.push("/dashboard")}
          className="mb-6 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-600 bg-clip-text text-transparent mb-2">
            List on Marketplace
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {nft.title} - Token #{tokenId}
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <motion.div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    currentStep > step
                      ? "bg-slate-600 dark:bg-slate-700 border-transparent text-white"
                      : currentStep === step
                      ? "border-slate-500 text-slate-600 dark:text-slate-400"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-400"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-bold">{step}</span>
                  )}
                </motion.div>
                <div className="ml-3 mr-8">
                  <p
                    className={`text-sm font-semibold ${
                      currentStep >= step ? "text-slate-600 dark:text-slate-400" : "text-zinc-400"
                    }`}
                  >
                    {step === 1 ? "Approve NFT" : "Set Price & List"}
                  </p>
                </div>
                {step < 2 && (
                  <div
                    className={`h-0.5 w-16 ${
                      currentStep > step ? "bg-slate-500 dark:bg-slate-600" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-4">Step 1: Approve NFT for Marketplace</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                You need to approve the marketplace contract to manage your NFT. This is a one-time transaction.
              </p>

              <ApproveMarketButton
                tokenId={tokenId}
                nftId={nft.id}
                onSuccess={() => {
                  setIsApproved(true);
                  setCurrentStep(2);
                  toast.success("NFT approved! Now set your price and list it.");
                }}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-4">Step 2: Set Price & List</h2>

              <div className="space-y-6">
                {/* Price Input */}
                <div>
                  <Label className="text-base font-semibold">Price (APOLLO)</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input
                      type="number"
                      placeholder="0.05"
                      value={priceEth}
                      onChange={(e) => setPriceEth(e.target.value)}
                      className="h-14 pl-10 text-lg bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Enter the price in APOLLO tokens
                  </p>
                </div>

                {/* Preview Box */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/20 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Your NFT will be listed at:</p>
                      <p className="text-3xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {priceEth || "0"} APOLLO
                      </p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4">
                      <DollarSign className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* List Button */}
                <Button
                  onClick={handleListNFT}
                  disabled={isListing || updateNFT.isPending || !priceEth || Number(priceEth) <= 0}
                  className="w-full h-14 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  {isListing || updateNFT.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Listing NFT...
                    </>
                  ) : (
                    "List on Marketplace"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
