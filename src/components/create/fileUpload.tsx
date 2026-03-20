"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Loader2, FileVideo, Music } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { startTusUpload, type TusUploadHandle } from "@/lib/tusUpload";
import { formatUploadProgress } from "@/lib/formatBytes";

interface FileUploadProps {
  onUploadComplete: (
    ipfsUrl: string,
    fileType: string,
    fileName: string
  ) => void;
  uploadedFile?: {
    ipfsUrl: string;
    type: string;
    name: string;
  } | null;
}

function getFileType(file: File): string {
  const type = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (type.startsWith("audio/")) return `audio/${type.split("/")[1]}`;
  if (type.startsWith("video/")) return `video/${type.split("/")[1]}`;
  if (type.startsWith("image/")) return `image/${type.split("/")[1]}`;

  if (type === "text/plain") return ext === "md" ? "txt/md" : "txt/txt";
  if (type === "application/msword") return "doc/doc";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "doc/docx";
  if (type === "application/pdf") return "pdf";

  if (ext) {
    if (ext === "txt") return "txt/txt";
    if (ext === "md") return "txt/md";
    if (ext === "doc") return "doc/doc";
    if (ext === "docx") return "doc/docx";
    if (ext === "pdf") return "pdf";
  }

  return "other";
}

export function FileUpload({
  onUploadComplete,
  uploadedFile,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadHandleRef = useRef<TusUploadHandle | null>(null);

  const acceptedTypes = [".md", ".pdf", ".doc", ".docx", ".txt"];

  const uploadToPinata = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadedBytes(0);
        setTotalBytes(file.size);

        // Get signed TUS URL
        const signedRes = await fetch("/api/pinata/signed-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            maxFileSize: 5 * 1024 * 1024 * 1024,
          }),
        });

        if (!signedRes.ok) throw new Error("Failed to get signed upload URL");

        const signedData = await signedRes.json() as { data?: { url?: string }; url?: string };
        const tusEndpoint = signedData?.data?.url ?? signedData?.url;
        if (!tusEndpoint) throw new Error("No TUS endpoint in signed URL response");

        await new Promise<void>((resolve, reject) => {
          uploadHandleRef.current = startTusUpload({
            file,
            endpoint: tusEndpoint,
            onProgress: (bytesSent, bytesTotal) => {
              setUploadedBytes(bytesSent);
              setTotalBytes(bytesTotal);
              setUploadProgress(Math.round((bytesSent / bytesTotal) * 100));
            },
            onSuccess: (cid) => {
              const ipfsUrl = `ipfs://${cid}`;
              const fileType = getFileType(file);
              setUploadProgress(100);
              onUploadComplete(ipfsUrl, fileType, file.name);
              toast.success("File uploaded successfully!");
              resolve();
            },
            onError: (err) => {
              reject(err);
            },
          });
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file"
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        uploadHandleRef.current = null;
      }
    },
    [onUploadComplete]
  );

  const handleFile = useCallback(
    (file: File) => {
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));
      const isMedia =
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/") ||
        file.type.startsWith("image/");

      if (!isMedia && !acceptedTypes.includes(fileExtension)) {
        toast.error(
          "Please upload audio, video, image, markdown, pdf, word, or text files only"
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024 * 1024) {
        toast.error("File size must be less than 5GB");
        return;
      }

      void uploadToPinata(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadToPinata]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {uploadedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-lg bg-zinc-950/20 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                {uploadedFile.type.startsWith("video/") ? (
                  <FileVideo className="h-6 w-6 text-cyan-500" />
                ) : uploadedFile.type.startsWith("audio/") ? (
                  <Music className="h-6 w-6 text-cyan-500" />
                ) : uploadedFile.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadedFile.ipfsUrl.replace(
                      "ipfs://",
                      "https://ipfs.io/ipfs/"
                    )}
                    alt="Uploaded"
                    className="h-6 w-6 object-cover rounded"
                  />
                ) : uploadedFile.type.startsWith("txt/") ? (
                  <span className="h-6 w-6 flex items-center justify-center text-cyan-500 font-bold text-lg">
                    TXT
                  </span>
                ) : null}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {uploadedFile.name}
                  </h3>
                  <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Type: {uploadedFile.type} • Uploaded successfully
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
                  {uploadedFile.ipfsUrl}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-12 backdrop-blur-lg text-center transition-all duration-300 bg-zinc-950/20
              ${
                isDragging
                  ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }
              ${isUploading ? "pointer-events-none opacity-75" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*,image/*,.md,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              onChange={handleFileInput}
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-white" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Uploading...
                  </p>
                  {totalBytes > 0 && (
                    <p className="text-xs text-zinc-400 mt-1">
                      {formatUploadProgress(uploadedBytes, totalBytes)}
                    </p>
                  )}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                <div className="mt-4">
                  <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                    Drag & drop your file here
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    or click to browse
                  </p>
                  <p className="mt-3 text-xs text-zinc-50 dark:text-zinc-500">
                    Accepted: Any audio, video, image, .md, .pdf, .doc, .docx, .txt • Max 5GB
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-sm">
        Already Have file?{" "}
        <Link
          href="/dashboard/create/metadata"
          className="text-cyan-400 underline hover:underline-offset-1"
        >
          Create Metadata
        </Link>
      </p>
    </div>
  );
}
