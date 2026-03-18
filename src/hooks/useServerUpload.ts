"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type ServerUploadStatus =
  | "idle"
  | "uploading-chunks"
  | "server-processing"
  | "completed"
  | "failed";

export interface ServerUploadState {
  fileId: string | null;
  status: ServerUploadStatus;
  /** 0–100: 0-80 = chunk send phase, 80-100 = server processing phase */
  progress: number;
  ipfsUrl: string | null;
  error: string | null;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
const POLL_INTERVAL_MS = 2000;

export function useServerUpload() {
  const [state, setState] = useState<ServerUploadState>({
    fileId: null,
    status: "idle",
    progress: 0,
    ipfsUrl: null,
    error: null,
  });

  const abortRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Poll server upload status during server-processing phase
  useEffect(() => {
    if (state.status !== "server-processing" || !state.fileId) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const fileId = state.fileId;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/status/${fileId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "COMPLETED") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setState((prev) => ({
            ...prev,
            status: "completed",
            progress: 100,
            ipfsUrl: data.ipfsUrl,
          }));
        } else if (data.status === "FAILED") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setState((prev) => ({
            ...prev,
            status: "failed",
            error: data.failureReason || "Upload failed on server",
          }));
        } else if (data.status === "UPLOADING" && typeof data.progress === "number") {
          // Scale server progress (0-100) to our range (80-100)
          const scaled = 80 + (data.progress / 100) * 20;
          setState((prev) => ({
            ...prev,
            progress: Math.max(prev.progress, scaled),
          }));
        }
      } catch {
        // Swallow transient polling errors; will retry next interval
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [state.status, state.fileId]);

  const startUpload = useCallback(
    async (
      file: File,
      role: "MAIN" | "COVER" | "TRAILER",
      walletAddress: string
    ): Promise<string> => {
      abortRef.current = false;
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

      setState({
        fileId: null,
        status: "uploading-chunks",
        progress: 0,
        ipfsUrl: null,
        error: null,
      });

      // --- Start upload session ---
      const startRes = await fetch("/api/upload/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          role,
          walletAddress,
          totalChunks,
        }),
      });

      if (!startRes.ok) {
        const errText = await startRes.text();
        const err = errText || "Failed to start upload";
        setState((prev) => ({ ...prev, status: "failed", error: err }));
        throw new Error(err);
      }

      const { fileId } = (await startRes.json()) as { fileId: string };
      setState((prev) => ({ ...prev, fileId }));

      // --- Send chunks sequentially ---
      for (let i = 0; i < totalChunks; i++) {
        if (abortRef.current) {
          setState((prev) => ({ ...prev, status: "failed", error: "Upload cancelled" }));
          return fileId;
        }

        const start = i * CHUNK_SIZE;
        const chunkBlob = file.slice(start, start + CHUNK_SIZE);

        const body = new FormData();
        body.append("chunk", chunkBlob);
        body.append("index", String(i));
        body.append("total", String(totalChunks));

        const chunkRes = await fetch(`/api/upload/chunk/${fileId}`, {
          method: "POST",
          body,
        });

        if (!chunkRes.ok) {
          const errText = await chunkRes.text();
          const err = errText || "Chunk upload failed";
          setState((prev) => ({ ...prev, status: "failed", error: err }));
          throw new Error(err);
        }

        setState((prev) => ({
          ...prev,
          progress: ((i + 1) / totalChunks) * 80,
        }));
      }

      // All chunks sent — server continues Pinata upload in background via after()
      setState((prev) => ({
        ...prev,
        status: "server-processing",
        progress: 80,
      }));

      return fileId;
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setState({
      fileId: null,
      status: "idle",
      progress: 0,
      ipfsUrl: null,
      error: null,
    });
    // Allow new uploads after this tick
    setTimeout(() => {
      abortRef.current = false;
    }, 0);
  }, []);

  return {
    ...state,
    isUploading:
      state.status === "uploading-chunks" || state.status === "server-processing",
    startUpload,
    reset,
  };
}
