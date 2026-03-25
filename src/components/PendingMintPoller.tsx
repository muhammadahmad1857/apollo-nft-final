"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { usePendingMints, type PendingMint } from "@/hooks/usePendingMints";
import { useMintContract } from "@/hooks/useMint";

/**
 * Invisible global component that:
 * 1. Polls pending mints for the connected wallet
 * 2. Detects when a pending_upload finishes (CID available) and finalizes it server-side
 * 3. Shows a persistent "Sign Now" toast when a mint is ready to go on-chain
 * 4. Handles the on-chain mint + DB cleanup when the user signs
 */
export default function PendingMintPoller() {
  const { address } = useAccount();
  const { pendingMints, refreshPendingMints } = usePendingMints(address);
  const { mint, handleToasts, isBusy } = useMintContract();

  const shownToastIds = useRef<Set<string>>(new Set());

  // Required: drive useMintContract's tx lifecycle (same pattern as mint page)
  useEffect(() => {
    handleToasts();
  }, [handleToasts]);

  // Stable ref so toast callbacks always call the latest mint function
  const mintRef = useRef(mint);
  const isBusyRef = useRef(isBusy);
  const refreshRef = useRef(refreshPendingMints);
  mintRef.current = mint;
  isBusyRef.current = isBusy;
  refreshRef.current = refreshPendingMints;

  useEffect(() => {
    if (!pendingMints.length) return;

    const readyToSign = pendingMints.filter((p) => p.status === "pending_sign");

    for (const pm of readyToSign) {
      if (shownToastIds.current.has(pm.id)) continue;
      shownToastIds.current.add(pm.id);

      showSignToast(pm);
    }
  }, [pendingMints]);

  const showSignToast = (pm: PendingMint) => {
    toast.info(`"${pm.title}" is ready to mint!`, {
      id: `pending-sign-${pm.id}`,
      duration: Infinity,
      description: "Your file finished uploading. One signature to go.",
      action: {
        label: "Sign Now",
        onClick: () => handleSign(pm),
      },
    });
  };

  const handleSign = async (pm: PendingMint) => {
    if (isBusyRef.current || !pm.metadataUrl) return;

    // Mark as minting to prevent duplicate attempts
    await fetch(`/api/pending-mints/${pm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "minting" }),
    });

    const { success } = await mintRef.current({
      tokenURI: pm.metadataUrl,
      royaltyBps: pm.royaltyBps,
    });

    if (success) {
      await fetch(`/api/pending-mints/${pm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "minted" }),
      });
      toast.dismiss(`pending-sign-${pm.id}`);
      toast.success(`"${pm.title}" minted! Check your collection.`);
      shownToastIds.current.delete(pm.id);
      refreshRef.current();
    } else {
      // Revert so user can retry
      await fetch(`/api/pending-mints/${pm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_sign" }),
      });
      shownToastIds.current.delete(pm.id);
    }
  };

  return null;
}
