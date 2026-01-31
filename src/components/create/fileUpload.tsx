"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Loader2, FileVideo, Music } from "lucide-react";
import { toast } from "sonner";

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

export function FileUpload({
  onUploadComplete,
  uploadedFile,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [".mp3", ".wav", ".mp4"];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const uploadToPinata = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get signed JWT
      const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
      console.log("JWT", jwtRes);
      if (!jwtRes.ok) {
        throw new Error("Failed to get upload token");
      }
      const { JWT } = await jwtRes.json();
    setUploadProgress(33)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("network","public")
      console.log("")
      setUploadProgress(50)
      // Upload to Pinata
      const uploadRes = await fetch(
        "https://uploads.pinata.cloud/v3/files",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${JWT}`,
          },
          body: formData,
        }
      );
      console.log("uploadRes", uploadRes);
      if (!uploadRes.ok) {
        const error = await uploadRes.text();
        throw new Error(error || "Upload failed");
      }
      setUploadProgress(77)
      const json = await uploadRes.json();
      console.log("uploadRes.json()", json);
      const ipfsHash = json.data.cid;
      const ipfsUrl = `ipfs://${ipfsHash}`;

      // Determine file type
      const fileExtension = file.name.toLowerCase().endsWith(".mp4")
        ? ".mp4"
        : file.name.toLowerCase().endsWith(".wav")
        ? ".wav"
        : ".mp3";

      setUploadProgress(100);
      onUploadComplete(ipfsUrl, fileExtension, file.name);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.log("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
// const uploadToPinata = async (file: File) => {
//   try {
//     setIsUploading(true);
//     setUploadProgress(0);

//     // 1️⃣ Get signed URL from your server
//     const signedRes = await fetch("/api/pinata/signed-upload-url", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ filename: file.name }),
//     });

//     if (!signedRes.ok) throw new Error("Failed to get signed URL");
//     const { data } = await signedRes.json();
//     setUploadProgress(33)
//     // 2️⃣ Prepare FormData for upload
//     const formData = new FormData();
//     // Object.entries(fields).forEach(([key, value]) => formData.append(key, value as string));
//     formData.append("file", file);
//     setUploadProgress(50)
   

//     // 3️⃣ Upload directly to Pinata
//     const uploadRes = await fetch(data, { method: "POST", body: formData });
//     if (!uploadRes.ok) throw new Error("Pinata upload failed");
//     const uploadResJson =  await uploadRes.json()
//     console.log("upload response",uploadResJson)

//     const ipfsHash = uploadResJson?.data.cid; // usually included in fields
//     const ipfsUrl = `ipfs://${ipfsHash}`;
//     setUploadProgress(75)
//     await fetch("/api/pinata/upload", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ cid: ipfsHash }),
// });
//     console.log(ipfsHash,ipfsUrl)
//     setUploadProgress(100);
//     onUploadComplete(ipfsUrl, `.${file.name.split(".").pop()}`||"" , file.name);
//     toast.success("File uploaded successfully!");
//   } catch (err) {
//     console.error("Upload error:", err);
//     toast.error(err instanceof Error ? err.message : "Upload failed");
//   } finally {
//     setIsUploading(false);
//     setUploadProgress(0);
//   }
// };

  const handleFile = useCallback(
    (file: File) => {
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));
      if (!acceptedTypes.includes(fileExtension)) {
        toast.error("Please upload .mp3, .wav, or .mp4 files only");
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }

      uploadToPinata(file);
    },
    [acceptedTypes, uploadToPinata]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
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
      if (file) {
        handleFile(file);
      }
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
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                {uploadedFile.type === ".mp4" ? (
                  <FileVideo className="h-6 w-6 text-cyan-500" />
                ) : (
                  <Music className="h-6 w-6 text-cyan-500" />
                )}
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
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300
              ${
                isDragging
                  ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }
              ${isUploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.mp4,audio/*,video/*"
              onChange={handleFileInput}
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Uploading...
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <motion.div
                      className="h-full bg-cyan-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
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
                  <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                    Accepted: .mp3, .wav, .mp4
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}