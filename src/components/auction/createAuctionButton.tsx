/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useCreateAuction } from "@/hooks/useAuction";
import { ApproveAuctionButton } from "./ApproveButton";
import { useUser } from "@/hooks/useUser";
import { useSettleAuction } from "@/hooks/useAuction";
import { getAuctionByNFT } from "@/actions/auction"; // your Prisma fetch
import { CalendarIcon } from "lucide-react";
import { differenceInHours, differenceInSeconds, format, startOfDay } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AuctionModel, BidModel, NFTModel, UserModel } from "@/generated/prisma/models";

const presetDurations = [
  { label: "1 hour", value: "1" },
  { label: "6 hours", value: "6" },
  { label: "24 hours", value: "24" },
  { label: "3 days", value: "72" },
  { label: "7 days", value: "168" },
  { label: "Custom", value: "custom" },
];

interface CreateAuctionButtonProps {
  tokenId: bigint;
  nftId: number;
  approvedAuction: boolean;
}

export function CreateAuctionButton({
  tokenId,
  nftId,
  approvedAuction,
}: CreateAuctionButtonProps) {
  const { address } = useAccount();
  const { data: user } = useUser(address || "");
  const { createAuction: createAuctionOnChain, isPending: isTxPending } =
    useCreateAuction();
  const [isApproved, setIsApproved] = useState(approvedAuction);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minBid, setMinBid] = useState("");
  const [duration, setDuration] = useState(""); // hours
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const toastIdRef = useRef<string | number | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [customHour, setCustomHour] = useState<string>("12");
  const [customMinute, setCustomMinute] = useState<string>("00");
  const [customPeriod, setCustomPeriod] = useState<"AM" | "PM">("PM");

  const { settleAuction, isPending: isSettlePending } = useSettleAuction();

  // Auction fetched from DB
  const [auction, setAuction] = useState<(AuctionModel & {
      seller: UserModel;
      nft: NFTModel;
      highestBidder: UserModel | null;
      bids: BidModel[];
    })
  | null>(null);
  const [auctionStatus, setAuctionStatus] = useState<"notStarted" | "ongoing" | "ended">(
    "notStarted"
  );

  // fetch auction
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const data = await getAuctionByNFT(nftId);
        if (data) setAuction(data);

        if (data) {
          const now = new Date();
          const start = new Date(data.startTime);
          const end = new Date(data.endTime);

          if (now < start) setAuctionStatus("notStarted");
          else if (now >= start && now <= end) setAuctionStatus("ongoing");
          else setAuctionStatus("ended");
        } else {
          setAuctionStatus("notStarted");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch auction data");
      }
    };

    fetchAuction();
  }, [nftId]);

  useEffect(() => {
    setIsApproved(approvedAuction);
  }, [approvedAuction]);

  // Toast lifecycle for transaction confirmation
  const {
    isSuccess: isReceiptSuccess,
    isLoading: isReceiptLoading,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txHash && isReceiptLoading && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Waiting for blockchain confirmation...");
    }

    if (isReceiptSuccess && toastIdRef.current) {
      toast.success("Transaction confirmed on chain ✅", { id: toastIdRef.current });
      toastIdRef.current = null;
      setTxHash(undefined);
      setOpen(false);
      router.push(`/auction/${nftId}`);
    }

    if (receiptError && toastIdRef.current) {
      toast.error(`Transaction failed: ${String(receiptError)}`, { id: toastIdRef.current });
      toastIdRef.current = null;
      setTxHash(undefined);
    }
  }, [isReceiptLoading, isReceiptSuccess, receiptError, txHash, router, nftId]);

  const handleCreateAuction = async () => {
    if (!address) return toast.error("Connect your wallet first");
    if (!minBid || !duration) return toast.error("Fill all fields");

    try {
      let durationHours = 0;

      if (duration === "custom") {
        if (!customEndDate) return toast.error("Pick an end date");

        // Convert 12-hour to 24-hour format
        let hour24 = parseInt(customHour);
        if (customPeriod === "PM" && hour24 !== 12) hour24 += 12;
        if (customPeriod === "AM" && hour24 === 12) hour24 = 0;

        // Create local datetime
        const localEndDateTime = new Date(customEndDate);
        localEndDateTime.setHours(hour24, parseInt(customMinute), 0, 0);

        const now = new Date();
        if (localEndDateTime <= now) return toast.error("End date & time must be in the future");

        // Calculate duration in seconds from local time
        const durationSeconds = differenceInSeconds(localEndDateTime, now);
        durationHours = durationSeconds / 3600;
      } else {
        durationHours = Number(duration);
      }

      const durationSec = BigInt(durationHours * 3600);

      const tx = await createAuctionOnChain(tokenId, durationSec, minBid, user?.id || 0, nftId);
      setTxHash(tx);
      toast.info("Transaction sent! Waiting for confirmation...");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create auction");
    }
  };

  // Decide button to render
  if (auction) {
    // Auction exists → show view or settle
    if (auctionStatus === "ongoing") {
      return (
        <Button onClick={() => router.push(`/auction/${auction.id}`)}>View Auction</Button>
      );
    } else if (auctionStatus === "ended") {
      return (
        <Button
          onClick={() => settleAuction(BigInt(tokenId), auction.id, auction.highestBidder?.id ?? null)}
          disabled={isSettlePending}
        >
          {isSettlePending ? "Settling..." : "Settle Auction"}
        </Button>
      );
    }
  }

  // No auction → show create auction dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!user}>Create Auction</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Auction</DialogTitle>
        </DialogHeader>

        {!user ? (
          <p>Loading user...</p>
        ) : !isApproved ? (
          <ApproveAuctionButton
            tokenId={Number(tokenId)}
            nftId={nftId}
            onSuccess={() => {
              setIsApproved(true);
            }}
          />
        ) : (
          <div className="space-y-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label>Minimum Bid (APOLLO)</Label>
              <Input
                type="number"
                placeholder="0.01"
                value={minBid}
                onChange={(e) => setMinBid(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Duration</Label>

              <Select
                value={duration}
                onValueChange={(val: any) => {
                  setDuration(val);
                  if (val !== "custom") setCustomEndDate(undefined);
                }}
              >
                <SelectTrigger>
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
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                      <Select value={customPeriod} onValueChange={(val: any) => setCustomPeriod(val)}>
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
                    <p className="text-xs text-muted-foreground">
                      End time: {format(customEndDate, "PPP")} at {customHour}:{customMinute} {customPeriod} (Your Local Time)
                      <br />
                      Duration: {(() => {
                        let hour24 = parseInt(customHour);
                        if (customPeriod === "PM" && hour24 !== 12) hour24 += 12;
                        if (customPeriod === "AM" && hour24 === 12) hour24 = 0;
                        
                        const endDateTime = new Date(customEndDate);
                        endDateTime.setHours(hour24, parseInt(customMinute), 0, 0);
                        
                        const totalSeconds = Math.max(0, differenceInSeconds(endDateTime, new Date()));
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        
                        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
                      })()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateAuction}
              disabled={isTxPending || !minBid || !duration}
              className="w-full"
            >
              {isTxPending ? "Creating..." : "Create Auction"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
