"use client";

import { useState, useRef, useCallback } from "react";

export type SignedUploadStatus = "idle" | "uploading" | "completed" | "failed";

export interface SignedUploadState {
  fileId: string | null;
  status: SignedUploadStatus;
  /** 0–100 from XHR progress events */
  progress: number;
  ipfsUrl: string | null;
  error: string | null;
}

export function useSignedUpload() {
  const [state, setState] = useState<SignedUploadState>({
    fileId: null,
    status: "idle",
    progress: 0,
    ipfsUrl: null,
    error: null,
  });

  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const startUpload = useCallback(
    async (
      file: File,
      role: "MAIN" | "COVER" | "TRAILER",
      walletAddress: string
    ): Promise<string> => {
      setState({ fileId: null, status: "uploading", progress: 0, ipfsUrl: null, error: null });

      // 1. Create File record in DB
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
      setState((prev) => ({ ...prev, fileId }));

      // 2. Get Pinata signed URL
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

      const { url } = (await signRes.json()) as { url: string };

      // 3. Upload directly to Pinata via XHR (progress tracking)
      const ipfsUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setState((prev) => ({
              ...prev,
              progress: Math.round((e.loaded / e.total) * 100),
            }));
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const cid = data?.data?.cid || data?.IpfsHash;
              if (!cid) {
                reject(new Error("No CID in Pinata response"));
              } else {
                resolve(`ipfs://${cid}`);
              }
            } catch {
              reject(new Error("Failed to parse Pinata response"));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("Network error during upload"));
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          reject(new Error("Upload cancelled"));
        };

        const formData = new FormData();
        formData.append("file", file, file.name);
        formData.append("network", "public");

        xhr.open("POST", url);
        xhr.send(formData);
      });

      // 4. Mark complete in DB and patch NFT media fields
      await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, ipfsUrl }),
      });

      setState((prev) => ({ ...prev, status: "completed", progress: 100, ipfsUrl }));
      return fileId;
    },
    []
  );

  const reset = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
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
