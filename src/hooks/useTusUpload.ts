"use client";

import { useState, useRef, useCallback } from "react";
import * as tus from "tus-js-client";

export type TusUploadStatus = "idle" | "uploading" | "completed" | "failed";

export interface TusUploadState {
  fileId: string | null;
  status: TusUploadStatus;
  progress: number;
  ipfsUrl: string | null;
  error: string | null;
}

export function useTusUpload() {
  const [state, setState] = useState<TusUploadState>({
    fileId: null,
    status: "idle",
    progress: 0,
    ipfsUrl: null,
    error: null,
  });

  const uploadRef = useRef<tus.Upload | null>(null);

  const startUpload = useCallback(
    async (
      file: File,
      role: "MAIN" | "COVER" | "TRAILER",
      walletAddress: string
    ): Promise<string> => {
      // 1. Create DB record → get fileId immediately (before upload starts)
      const startRes = await fetch("/api/upload/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          role,
          walletAddress,
          totalChunks: 1,
        }),
      });

      if (!startRes.ok) {
        const err = await startRes.text();
        setState((prev) => ({ ...prev, status: "failed", error: err }));
        throw new Error(err);
      }

      const { fileId } = (await startRes.json()) as { fileId: string };
      setState({ fileId, status: "uploading", progress: 0, ipfsUrl: null, error: null });

      // 2. Get Pinata signed upload URL
      const signRes = await fetch("/api/pinata/signed-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });

      if (!signRes.ok) {
        const err = await signRes.text();
        setState((prev) => ({ ...prev, status: "failed", error: err }));
        throw new Error(err);
      }

      const { url: signedUrl } = (await signRes.json()) as { url: string };

      // 3. Start TUS upload — non-blocking, upload continues while user can mint
      const upload = new tus.Upload(file, {
        endpoint: signedUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 50 * 1024 * 1024, // 50MB chunks
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        fingerprint: () =>
          Promise.resolve(`apollo-tus-${fileId}-${file.name}-${file.size}`),
        metadata: {
          filename: file.name,
          filetype: file.type || "application/octet-stream",
          name: file.name,
          network: "public",
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
          setState((prev) => ({ ...prev, progress: pct }));
        },
        onSuccess: async () => {
          const tusUrl = upload.url;
          if (!tusUrl) {
            setState((prev) => ({ ...prev, status: "failed", error: "No upload URL returned" }));
            return;
          }
          try {
            const completeRes = await fetch("/api/upload/tus-complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileId, pinataUploadUrl: tusUrl }),
            });
            if (completeRes.ok) {
              const { ipfsUrl } = (await completeRes.json()) as { ipfsUrl: string };
              setState((prev) => ({ ...prev, status: "completed", progress: 100, ipfsUrl }));
            } else {
              setState((prev) => ({
                ...prev,
                status: "failed",
                error: "Failed to finalize upload",
              }));
            }
          } catch {
            setState((prev) => ({
              ...prev,
              status: "failed",
              error: "Failed to finalize upload",
            }));
          }
        },
        onError: (error) => {
          const msg = error instanceof Error ? error.message : "Upload failed";
          setState((prev) => ({ ...prev, status: "failed", error: msg }));
        },
      });

      uploadRef.current = upload;

      // Resume previous upload session if found in localStorage
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      upload.start();

      // Return fileId immediately — TUS upload continues in background
      return fileId;
    },
    []
  );

  const reset = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort(false); // stop locally, no server DELETE
      uploadRef.current = null;
    }
    setState({ fileId: null, status: "idle", progress: 0, ipfsUrl: null, error: null });
  }, []);

  return {
    ...state,
    isUploading: state.status === "uploading",
    startUpload,
    reset,
  };
}
