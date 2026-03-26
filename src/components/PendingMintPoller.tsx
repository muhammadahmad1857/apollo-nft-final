"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { usePendingMints, type PendingMint } from "@/hooks/usePendingMints";
import { useMintContract } from "@/hooks/useMint";
import { PendingMintSignButton } from "@/components/PendingMintSignButton";

/**
 * Global component that:
 * 1. Polls pending mints for the connected wallet
 * 2. Detects when a pending_upload finishes (CID available) and finalizes it server-side
 * 3. Shows a persistent "Sign Now" toast when a mint is ready to go on-chain
 * 4. Renders a visible panel for all pending_sign items
 */
export default function PendingMintPoller() {
  const { address } = useAccount();
  const { pendingMints, refreshPendingMints } = usePendingMints(address);
  const { mint, handleToasts, isBusy } = useMintContract();

  const shownToastIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    handleToasts();
  }, [handleToasts]);

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

    await fetch(`/api/pending-mints/${pm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "minting" }),
    });

    const { success } = await mintRef.current({
      tokenURI: pm.metadataUrl,
      royaltyBps: pm.royaltyBps,
      quantity: pm.quantity,
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
      await fetch(`/api/pending-mints/${pm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_sign" }),
      });
      shownToastIds.current.delete(pm.id);
    }
  };

  const readyToSign = pendingMints.filter((p) => p.status === "pending_sign");
  if (!readyToSign.length) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {readyToSign.map((pm) => (
        <div
          key={pm.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-cyan-400/30 bg-zinc-900/90 backdrop-blur-md px-4 py-3 shadow-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-sm font-medium text-white truncate">
              {pm.title} <span className="text-zinc-400 font-normal">ready to mint</span>
            </p>
          </div>
          <PendingMintSignButton
            pendingMintId={pm.id}
            initialMetadataUrl={pm.metadataUrl}
            initialRoyaltyBps={pm.royaltyBps}
            initialQuantity={pm.quantity}
            initialTitle={pm.title}
            onMinted={() => refreshRef.current()}
          />
        </div>
      ))}
    </div>
  );
}
