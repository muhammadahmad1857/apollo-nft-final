"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, CalendarIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useUser } from "@/hooks/useUser";
import { useCreateAuction } from "@/hooks/useAuction";
import { ApproveAuctionButton } from "@/components/auction/ApproveButton";
import { getNFTByTokenId } from "@/actions/nft";
import { differenceInSeconds, format, startOfDay } from "date-fns";
import { NFTModel } from "@/generated/prisma/models";

const presetDurations = [
  { label: "1 hour", value: "1" },
  { label: "6 hours", value: "6" },
  { label: "24 hours", value: "24" },
  { label: "3 days", value: "72" },
  { label: "7 days", value: "168" },
  { label: "Custom", value: "custom" },
];

export default function CreateAuctionPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = Number(params.tokenid);
  const { address } = useAccount();
  const { data: user } = useUser(address || "");

  const [currentStep, setCurrentStep] = useState(1);
  const [nft, setNft] = useState<NFTModel | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [minBid, setMinBid] = useState("");
  const [duration, setDuration] = useState("");
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [customHour, setCustomHour] = useState<string>("12");
  const [customMinute, setCustomMinute] = useState<string>("00");
  const [customPeriod, setCustomPeriod] = useState<"AM" | "PM">("PM");

  const { createAuction, isPending: isTxPending } = useCreateAuction();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const toastIdRef = useRef<string | number | null>(null);

  const {
    isSuccess: isReceiptSuccess,
    isLoading: isReceiptLoading,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Fetch NFT data
  useEffect(() => {
    const fetchNFT = async () => {
      try {
        const data = await getNFTByTokenId(tokenId);
        if (data) {
          setNft(data);
          setIsApproved(data.approvedAuction);
          if (data.approvedAuction) {
            setCurrentStep(2);
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

  // Toast lifecycle for transaction confirmation
  useEffect(() => {
    if (!txHash) return;
    
    if (isReceiptLoading && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Waiting for blockchain confirmation...");
    }

    if (isReceiptSuccess && toastIdRef.current) {
      toast.success("Auction created successfully! 🎉", { id: toastIdRef.current });
      toastIdRef.current = null;
      setTimeout(() => {
        router.push(`/auction/${nft?.id}`);
      }, 1500);
    }

    if (receiptError && toastIdRef.current) {
      toast.error(`Transaction failed: ${String(receiptError)}`, { id: toastIdRef.current });
      toastIdRef.current = null;
    }
  }, [isReceiptLoading, isReceiptSuccess, receiptError, txHash, router, nft]);

  const handleCreateAuction = async () => {
    if (!address) return toast.error("Connect your wallet first");
    if (!minBid || !duration) return toast.error("Fill all fields");
    if (!nft) return toast.error("NFT not found");

    try {
      let durationHours = 0;

      if (duration === "custom") {
        if (!customEndDate) return toast.error("Pick an end date");

        let hour24 = parseInt(customHour);
        if (customPeriod === "PM" && hour24 !== 12) hour24 += 12;
        if (customPeriod === "AM" && hour24 === 12) hour24 = 0;

        const localEndDateTime = new Date(customEndDate);
        localEndDateTime.setHours(hour24, parseInt(customMinute), 0, 0);

        const now = new Date();
        if (localEndDateTime <= now) return toast.error("End date & time must be in the future");

        const durationSeconds = differenceInSeconds(localEndDateTime, now);
        durationHours = durationSeconds / 3600;
      } else {
        durationHours = Number(duration);
      }

      const durationSec = BigInt(Math.floor(durationHours * 3600));

      const tx = await createAuction(BigInt(tokenId), durationSec, minBid, user?.id || 0, nft.id);
      setTxHash(tx);
      toast.info("Transaction sent! Waiting for confirmation...");
    } catch (err) {
      console.error(err);
      toast.error((err as Error)?.message || "Failed to create auction");
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
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Auction
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
                      currentStep >= step ? "text-slate-600 dark:text-slate-200" : "text-zinc-200"
                    }`}
                  >
                    {step === 1 ? "Approve NFT" : "Create Auction"}
                  </p>
                </div>
                {step < 2 && (
                  <div
                    className={`h-0.5 w-16 ${
                      currentStep > step ? "bg-slate-500 dark:bg-slate-300" : "bg-zinc-300 dark:bg-zinc-300"
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
              <h2 className="text-2xl font-bold mb-4">Step 1: Approve NFT for Auction</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                You need to approve the auction contract to manage your NFT. This is a one-time transaction.
              </p>

              <ApproveAuctionButton
                tokenId={tokenId}
                nftId={nft.id}
                onSuccess={() => {
                  setIsApproved(true);
                  setCurrentStep(2);
                  toast.success("NFT approved! Now create your auction.");
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
              <h2 className="text-2xl font-bold mb-4">Step 2: Set Auction Details</h2>

              <div className="space-y-6">
                {/* Min Bid */}
                <div>
                  <Label className="text-base font-semibold">Minimum Bid (APOLLO)</Label>
                  <Input
                    type="number"
                    placeholder="0.01"
                    value={minBid}
                    onChange={(e) => setMinBid(e.target.value)}
                    className="mt-2 h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-base font-semibold">Duration</Label>
                  <Select
                    value={duration}
                    onValueChange={(val) => {
                      setDuration(val);
                      if (val !== "custom") setCustomEndDate(undefined);
                    }}
                  >
                    <SelectTrigger className="mt-2 h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700">
                      <SelectValue
                        placeholder={
                          duration === "custom"
                            ? customEndDate
                              ? format(customEndDate, "PPP")
                              : "Pick end date"
                            : "Select auction duration"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {presetDurations.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {duration === "custom" && (
                    <div className="mt-4 space-y-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal h-12">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customEndDate ? format(customEndDate, "PPP") : "Pick an end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customEndDate}
                            onSelect={setCustomEndDate}
                            disabled={(date) => date < startOfDay(new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Label className="text-xs">Hour (1-12)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            value={customHour}
                            onChange={(e) => {
                              const val = Math.min(12, Math.max(1, parseInt(e.target.value) || 1));
                              setCustomHour(val.toString());
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Minute (0-59)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={customMinute}
                            onChange={(e) => {
                              const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                              setCustomMinute(val.toString().padStart(2, "0"));
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Period</Label>
                          <Select value={customPeriod} onValueChange={(val) => setCustomPeriod(val as "AM" | "PM")}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {customEndDate && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          End time: {format(customEndDate, "PPP")} at {customHour}:{customMinute} {customPeriod}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateAuction}
                  disabled={isTxPending || isReceiptLoading || !minBid || !duration}
                  className="w-full h-14 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  {isTxPending || isReceiptLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Auction...
                    </>
                  ) : (
                    "Create Auction"
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
