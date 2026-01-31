/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useCreateAuction } from "@/hooks/useAuction"; // your wagmi hook
import { createAuction as createAuctionInDB } from "@/actions/auction"; // your server action

interface CreateAuctionButtonProps {
  tokenId: bigint;
}

export function CreateAuctionButton({ tokenId }: CreateAuctionButtonProps) {
  const { address } = useAccount();
  const { createAuction: createAuctionOnChain, isPending } = useCreateAuction();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [minBid, setMinBid] = useState("");
  const [duration, setDuration] = useState(""); // in hours

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const {
    data: receipt,
    isSuccess: isReceiptSuccess,
    isLoading: isReceiptLoading,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCreateAuction = async () => {
    if (!address) return toast.error("Connect your wallet first");
    if (!minBid || !duration) return toast.error("Fill all fields");

    try {
      const durationSec = BigInt(Number(duration) * 3600); // hours → seconds

      // 1️⃣ Call smart contract
      const txHashResult = await createAuctionOnChain(tokenId, durationSec, minBid);
      setTxHash(txHashResult);
      toast.info("Transaction sent! Waiting for confirmation...");

      // 2️⃣ Wait for blockchain confirmation
      // Wait until receipt is loaded and successful
      await new Promise<void>((resolve, reject) => {
        const checkReceipt = () => {
          if (isReceiptSuccess && Number(receipt?.status) === 1) {
            resolve();
          } else if (receiptError) {
            reject(receiptError);
          } else {
            setTimeout(checkReceipt, 1000);
          }
        };
        checkReceipt();
      });

      // 3️⃣ Update DB
      await createAuctionInDB({
        nft: {
            connect: { tokenId: Number(tokenId) },
        },
        seller: {
            connect: { walletAddress:address },
        },
        minBid: Number(minBid),
        startTime: new Date(),
        endTime: new Date(Date.now() + Number(durationSec) * 1000),
      });

      toast.success("Auction created!");
      setOpen(false);
      setTxHash(undefined);

      // 4️⃣ Redirect to auction page
      router.push(`/auctions/${tokenId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create auction");
      setTxHash(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Auction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Auction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex flex-col">
            <Label>Minimum Bid (ETH)</Label>
            <Input
              type="number"
              placeholder="0.01"
              value={minBid}
              onChange={(e) => setMinBid(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label>Duration (hours)</Label>
            <Input
              type="number"
              placeholder="24"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateAuction} disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Auction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
