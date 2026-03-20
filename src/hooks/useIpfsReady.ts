"use client";

import { useEffect, useRef, useState } from "react";
import { resolveIpfs } from "@/components/ui/UniversalMediaViewer";
import { getProcessingStatus, markReady } from "@/lib/nftProcessingState";

export type ReadyState = "unknown" | "processing" | "ready";

const POLL_INTERVAL_MS = 15_000;
const MAX_POLL_ATTEMPTS = 48; // 12 minutes max

export function useIpfsReady(mediaUrl: string | null | undefined): ReadyState {
  const [state, setState] = useState<ReadyState>(() => {
    if (!mediaUrl) return "unknown";
    const stored = getProcessingStatus(mediaUrl);
    if (stored === "processing") return "processing";
    if (stored === "ready") return "ready";
    return "unknown";
  });

  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!mediaUrl || state !== "processing") return;

    const gatewayUrl = resolveIpfs(mediaUrl);
    if (!gatewayUrl) return;

    attemptRef.current = 0;

    const checkReady = async () => {
      attemptRef.current += 1;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(gatewayUrl, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          markReady(mediaUrl);
          setState("ready");
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
      } catch {
        // network error or timeout — keep polling
      }

      if (attemptRef.current >= MAX_POLL_ATTEMPTS) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    void checkReady();
    timerRef.current = setInterval(checkReady, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mediaUrl, state]);

  return state;
}
