"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface PendingMint {
  id: string;
  walletAddress: string;
  pinataFileId: string;
  pinataFilename?: string | null;
  name: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  fileType: string;
  trailerUrl?: string | null;
  trailerFileType?: string | null;
  royaltyBps: number;
  mediaUrl?: string | null;
  metadataUrl?: string | null;
  status: "pending_upload" | "pending_sign" | "minting" | "minted" | "failed";
  createdAt: string;
}

export function usePendingMints(wallet: string | undefined) {
  const [pendingMints, setPendingMints] = useState<PendingMint[]>([]);
  const finalizedIds = useRef<Set<string>>(new Set());

  const fetchPendingMints = useCallback(async () => {
    if (!wallet) {
      setPendingMints([]);
      return;
    }
    try {
      const res = await fetch(`/api/pending-mints?wallet=${wallet}`);
      if (!res.ok) return;
      const { pendingMints: data } = (await res.json()) as { pendingMints: PendingMint[] };
      setPendingMints(data ?? []);
    } catch {
      // silently ignore — poller will retry
    }
  }, [wallet]);

  // Poll Pinata for CID on pending_upload items, then finalize
  useEffect(() => {
    const checkAndFinalize = async () => {
      const uploading = pendingMints.filter(
        (p) => p.status === "pending_upload" && !finalizedIds.current.has(p.id)
      );
      if (!uploading.length) return;

      for (const pm of uploading) {
        try {
          const filenameParam = pm.pinataFilename ? `&filename=${encodeURIComponent(pm.pinataFilename)}` : "";
          const res = await fetch(`/api/pinata/file-info?id=${pm.pinataFileId}${filenameParam}`);
          if (!res.ok) continue;
          const { cid } = (await res.json()) as { cid?: string };
          if (!cid) continue;

          finalizedIds.current.add(pm.id);
          const mediaUrl = `ipfs://${cid}`;

          const finalizeRes = await fetch(`/api/pending-mints/${pm.id}/finalize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaUrl }),
          });

          if (finalizeRes.ok) {
            fetchPendingMints();
          } else {
            finalizedIds.current.delete(pm.id);
          }
        } catch {
          // will retry on next poll
        }
      }
    };

    checkAndFinalize();
  }, [pendingMints, fetchPendingMints]);

  // Poll every 15s while there are active pending mints
  useEffect(() => {
    fetchPendingMints();
    const interval = setInterval(fetchPendingMints, 15_000);
    return () => clearInterval(interval);
  }, [fetchPendingMints]);

  return { pendingMints, refreshPendingMints: fetchPendingMints };
}
