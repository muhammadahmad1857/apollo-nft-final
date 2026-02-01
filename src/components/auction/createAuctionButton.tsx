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
import { createAuction as createAuctionInDB } from "@/actions/auction";
import { ApproveAuctionButton } from "./ApproveButton";
import { useUser } from "@/hooks/useUser";

interface CreateAuctionButtonProps {
  tokenId: bigint;
  nftId:number;
  approvedAuction:boolean
  disabled?: boolean;
}

export function CreateAuctionButton({ tokenId, disabled = false,nftId,approvedAuction }: CreateAuctionButtonProps) {
  const { address } = useAccount();
  const { data: user, refetch, isLoading: isUserLoading } = useUser(address || "");
  const { createAuction: createAuctionOnChain, isPending: isTxPending } = useCreateAuction();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [minBid, setMinBid] = useState("");
  const [duration, setDuration] = useState(""); // hours
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const toastIdRef = useRef<string | number | null>(null);

  const {
    data: receipt,
    isSuccess: isReceiptSuccess,
    isLoading: isReceiptLoading,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Show error if user fetch failed
  useEffect(() => {
    if (!isUserLoading && !user) {
      toast.error("Something went wrong while fetching user.");
    }
  }, [user, isUserLoading]);

  // Toast lifecycle for transaction confirmation
  useEffect(() => {
    if (txHash && isReceiptLoading && !toastIdRef.current) {
      toastIdRef.current = toast.loading("Waiting for blockchain confirmation...");
    }

    if (isReceiptSuccess && toastIdRef.current) {
      toast.success("Transaction confirmed on chain ✅", { id: toastIdRef.current });
      toastIdRef.current = null;
    }

    if (receiptError && toastIdRef.current) {
      toast.error(`Transaction failed: ${String(receiptError)}`, { id: toastIdRef.current });
      toastIdRef.current = null;
      setTxHash(undefined);
    }
  }, [isReceiptLoading, isReceiptSuccess, receiptError, txHash]);

  const handleCreateAuction = async () => {
    if (!address) return toast.error("Connect your wallet first");
    if (!minBid || !duration) return toast.error("Fill all fields");

    try {
      const durationSec = BigInt(Number(duration) * 3600);

      // 1️⃣ Call smart contract
      const tx = await createAuctionOnChain(tokenId, durationSec, minBid,user?.id||0,nftId);
      setTxHash(tx);
      toast.info("Transaction sent! Waiting for confirmation...");

      // 2️⃣ Wait for blockchain confirmation
      // Poll for receipt
      let receiptConfirmed = false;
      while (!receiptConfirmed) {
        if (isReceiptSuccess) {
          receiptConfirmed = true;
          break;
        }
        if (receiptError) throw receiptError;
        await new Promise((r) => setTimeout(r, 1000)); // 1 sec
      }

    
      setOpen(false);
      setTxHash(undefined);

      // 4️⃣ Redirect to auction page
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create auction");
      setTxHash(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Create Auction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Auction</DialogTitle>
        </DialogHeader>

        {!user ? (
          <p>Loading user...</p>
        ) : !approvedAuction ? (
          <ApproveAuctionButton tokenId={Number(tokenId)} nftId={nftId} onSuccess={() => refetch && refetch()} />
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
              <Label>Duration (hours)</Label>
              <Input
                type="number"
                placeholder="24"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
           { !disabled?<Button
              onClick={handleCreateAuction}
              disabled={isTxPending || !minBid || !duration}
              className="w-full"
            >
              {isTxPending ? "Creating..." :  "Create Auction"}
            </Button>
            :
            <Button
              onClick={()=>router.push(`/auction/${Number(nftId)}`)}
              className="w-full"
            >
              View Auction
            </Button>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
