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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { data: user, isLoading: isUserLoading } = useUser(address || "");
  const { createAuction: createAuctionOnChain, isPending: isTxPending } =
    useCreateAuction();
  const [isApproved, setIsApproved] = useState(approvedAuction);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [minBid, setMinBid] = useState("");
  const [duration, setDuration] = useState(""); // hours
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const toastIdRef = useRef<string | number | null>(null);

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
      const durationSec = BigInt(Number(duration) * 3600);

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
              toast.success("NFT approved for auction ✅");
              setIsApproved(true);
            }}
          />
        ) : (
          <div className="space-y-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label>Minimum Bid (Apollo)</Label>
              <Input
                type="number"
                placeholder="0.01"
                value={minBid}
                onChange={(e) => setMinBid(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Duration</Label>

              <Select value={duration} onValueChange={(val: any) => setDuration(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select auction duration" />
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
                <Input
                  type="number"
                  placeholder="Enter hours..."
                  onChange={(e) => setDuration(e.target.value)}
                />
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
