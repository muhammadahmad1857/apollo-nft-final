"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMintContract } from "@/hooks/useMint";

interface Props {
  pendingMintId: string;
  /** Optional: if already known, avoids an extra fetch */
  initialMetadataUrl?: string | null;
  initialRoyaltyBps?: number;
  initialQuantity?: number;
  initialTitle?: string;
  onMinted?: () => void;
}

export function PendingMintSignButton({
  pendingMintId,
  initialMetadataUrl,
  initialRoyaltyBps,
  initialQuantity,
  initialTitle,
  onMinted,
}: Props) {
  const { mint, isBusy, handleToasts } = useMintContract();
  const [metadataUrl, setMetadataUrl] = useState<string | null>(initialMetadataUrl ?? null);
  const [royaltyBps, setRoyaltyBps] = useState<number>(initialRoyaltyBps ?? 500);
  const [quantity, setQuantity] = useState<number>(initialQuantity ?? 1);
  const [title, setTitle] = useState<string>(initialTitle ?? "");
  const [isSigning, setIsSigning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { handleToasts(); }, [handleToasts]);

  // Fetch if not passed in
  useEffect(() => {
    if (initialMetadataUrl) return;
    fetch(`/api/pending-mints/${pendingMintId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.pendingMint) return;
        setMetadataUrl(data.pendingMint.metadataUrl ?? null);
        setRoyaltyBps(data.pendingMint.royaltyBps ?? 500);
        setQuantity(data.pendingMint.quantity ?? 1);
        setTitle(data.pendingMint.title ?? "");
        if (data.pendingMint.status === "minted") setDone(true);
      })
      .catch(() => {});
  }, [pendingMintId, initialMetadataUrl]);

  if (done || !metadataUrl) return null;

  const handleSign = async () => {
    if (isBusy || isSigning) return;
    setIsSigning(true);

    await fetch(`/api/pending-mints/${pendingMintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "minting" }),
    });

    const { success } = await mint({ tokenURI: metadataUrl, royaltyBps, quantity });

    if (success) {
      await fetch(`/api/pending-mints/${pendingMintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "minted" }),
      });
      toast.success(`"${title || "NFT"}" minted! Check your collection.`);
      setDone(true);
      onMinted?.();
    } else {
      await fetch(`/api/pending-mints/${pendingMintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_sign" }),
      });
      setIsSigning(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleSign}
      disabled={isSigning || isBusy}
      className="bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/30"
    >
      {isSigning ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          Signing...
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Sign &amp; Mint
        </>
      )}
    </Button>
  );
}
