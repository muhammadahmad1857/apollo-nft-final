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
  quantity: number;
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
      console.log(`[Pending Mints] No wallet, clearing pending mints`);
      setPendingMints([]);
      return;
    }
    try {
      console.log(`[Pending Mints] Fetching pending mints for wallet: ${wallet}`);
      const res = await fetch(`/api/pending-mints?wallet=${wallet}`);
      if (!res.ok) {
        console.warn(`[Pending Mints] FAILED: HTTP ${res.status}`);
        return;
      }
      const { pendingMints: data } = (await res.json()) as { pendingMints: PendingMint[] };
      console.log(`[Pending Mints] Loaded ${data?.length ?? 0} pending mints`);
      setPendingMints(data ?? []);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Pending Mints] FAILED to fetch: ${errMsg}`);
      // silently ignore — poller will retry
    }
  }, [wallet]);

  // Poll Pinata for CID on pending_upload items, then finalize
  useEffect(() => {
    const checkAndFinalize = async () => {
      const uploading = pendingMints.filter(
        (p) => p.status === "pending_upload" && !finalizedIds.current.has(p.id)
      );
      if (!uploading.length) {
        console.log(`[Check & Finalize] No pending uploads to check`);
        return;
      }

      console.log(
        `[Check & Finalize] Checking ${uploading.length} pending uploads for CID...`
      );

      for (const pm of uploading) {
        try {
          console.log(
            `[Check & Finalize] Checking CID for mint ID: ${pm.id}, Pinata file ID: ${pm.pinataFileId}`
          );
          const filenameParam = pm.pinataFilename ? `&filename=${encodeURIComponent(pm.pinataFilename)}` : "";
          const res = await fetch(`/api/pinata/file-info?id=${pm.pinataFileId}${filenameParam}`);
          if (!res.ok) {
            console.warn(
              `[Check & Finalize] HTTP ${res.status} for file-info, will retry next poll`
            );
            continue;
          }
          const { cid } = (await res.json()) as { cid?: string };
          if (!cid) {
            console.log(
              `[Check & Finalize] CID not ready yet for mint ${pm.id}, will retry next poll`
            );
            continue;
          }

          console.log(
            `[Check & Finalize] CID resolved! ${pm.id} -> ${cid}. Finalizing mint...`
          );
          finalizedIds.current.add(pm.id);
          const mediaUrl = `ipfs://${cid}`;

          const finalizeRes = await fetch(`/api/pending-mints/${pm.id}/finalize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaUrl }),
          });

          if (finalizeRes.ok) {
            console.log(`[Check & Finalize] SUCCESS! Mint ${pm.id} finalized`);
            fetchPendingMints();
          } else {
            console.error(
              `[Check & Finalize] FAILED to finalize mint ${pm.id}: HTTP ${finalizeRes.status}`
            );
            finalizedIds.current.delete(pm.id);
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(
            `[Check & Finalize] Exception checking mint ${pm.id}: ${errMsg}`
          );
          // will retry on next poll
        }
      }
    };

    checkAndFinalize();
  }, [pendingMints, fetchPendingMints]);

  // Poll every 15s while there are active pending mints
  useEffect(() => {
    console.log(`[Pending Mints Polling] Starting 15s poll interval`);
    fetchPendingMints();
    const interval = setInterval(() => {
      console.log(`[Pending Mints Polling] Polling cycle...`);
      fetchPendingMints();
    }, 15_000);
    return () => {
      console.log(`[Pending Mints Polling] Cleaning up poll interval`);
      clearInterval(interval);
    };
  }, [fetchPendingMints]);

  return { pendingMints, refreshPendingMints: fetchPendingMints };
}
