"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Image as ImageIcon,
  Loader2,
  Upload,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const PINATA_GATEWAY = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`;

function getFileType(file: File): string {
  const type = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase();

  // Handle audio/video/image dynamically
  if (type.startsWith("audio/")) return `audio/${type.split("/")[1]}`;
  if (type.startsWith("video/")) return `video/${type.split("/")[1]}`;
  if (type.startsWith("image/")) return `image/${type.split("/")[1]}`;

  // Handle specific MIME types
  if (type === "text/plain") return ext === "md" ? "txt/md" : "txt/txt";
  if (type === "application/msword") return "doc/doc";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "doc/docx";
  if (type === "application/pdf") return "pdf";

  // Fallback to extension if MIME type is empty or unknown
  if (ext) {
    if (ext === "txt") return "txt/txt";
    if (ext === "md") return "txt/md";
    if (ext === "doc") return "doc/doc";
    if (ext === "docx") return "doc/docx";
    if (ext === "pdf") return "pdf";
  }

  return "other"; // unknown type
}

export interface MintFormValues {
  name: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  musicTrackUrl: string;
  fileType?: string;
  royaltyBps: number;
}

interface MintMetadataFormProps {
  values: MintFormValues;
  onChange: (values: MintFormValues) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  royaltyLabel?: string;
}

export function MintMetadataForm({
  values,
  onChange,
  onRemove,
  showRemoveButton = false,
  royaltyLabel = "Royalty Percentage",
}: MintMetadataFormProps) {
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (field: keyof MintFormValues, value: string | number | undefined) => {
      onChange({
        ...values,
        [field]: value,
      });
    },
    [onChange, values]
  );

  // Upload cover image to Pinata
  const uploadCoverImage = useCallback(
    async (file: File) => {
      try {
        setIsUploadingCover(true);

        const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
        if (!jwtRes.ok) {
          throw new Error("Failed to get upload token");
        }
        const { JWT } = await jwtRes.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("network", "public");

        const uploadRes = await fetch(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${JWT}`,
            },
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          const error = await uploadRes.text();
          throw new Error(error || "Upload failed");
        }

        const json = await uploadRes.json();
        const ipfsHash = json.IpfsHash;
        const ipfsUrl = `ipfs://${ipfsHash}`;

        handleChange("coverImageUrl", ipfsUrl);
        toast.success("Cover image uploaded!");
      } catch (error) {
        console.error("Cover upload error:", error);
        toast.error("Failed to upload cover image");
      } finally {
        setIsUploadingCover(false);
      }
    },
    [handleChange]
  );

  // Handle cover file selection/drop
  const handleCoverFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      setIsUploadingCover(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      uploadCoverImage(file);
    },
    [uploadCoverImage]
  );

  const handleCoverDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleCoverFile(file);
      }
    },
    [handleCoverFile]
  );

  const removeCover = () => {
    handleChange("coverImageUrl", undefined);
    setCoverPreview(null);
  };

  // Upload file to Pinata
  const uploadToPinata = useCallback(
    async (file: File) => {
      try {
        setIsUploadingFile(true);
        setUploadProgress(0);

        const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
        if (!jwtRes.ok) {
          throw new Error("Failed to get upload token");
        }
        const { JWT } = await jwtRes.json();
        setUploadProgress(33);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("network", "public");
        setUploadProgress(50);

        const uploadRes = await fetch(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${JWT}`,
            },
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          const error = await uploadRes.text();
          throw new Error(error || "Upload failed");
        }

        setUploadProgress(77);
        const json = await uploadRes.json();
        const ipfsHash = json.IpfsHash;
        const ipfsUrl = `ipfs://${ipfsHash}`;
        const detectedFileType = getFileType(file);

        setUploadProgress(100);
        handleChange("musicTrackUrl", ipfsUrl);
        handleChange("fileType", detectedFileType);
        
        // Delay toast to ensure state updates propagate before re-render
        setTimeout(() => {
          toast.success("✓ File uploaded successfully!", {
            description: "Your NFT file is ready to mint",
          });
        }, 50);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload file", {
          description: error instanceof Error ? error.message : "Please try again",
        });
      } finally {
        setIsUploadingFile(false);
        setUploadProgress(0);
      }
    },
    [handleChange]
  );

  // Handle file selection
  const handleFile = useCallback(
    (file: File) => {
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));
      const acceptedTypes = [".md", ".pdf", ".doc", ".docx", ".txt"];

      const isMedia =
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/") ||
        file.type.startsWith("image/");

      if (!isMedia && !acceptedTypes.includes(fileExtension)) {
        toast.error(
          "Please upload audio, video, image, markdown, pdf, word, or text files only (.md, .pdf, .doc, .docx, .txt, or any video/*, audio/*, image/*)"
        );
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }

      uploadToPinata(file);
    },
    [uploadToPinata]
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl backdrop-blur-lg bg-zinc-950/20 border border-zinc-200/10 dark:border-zinc-800/30 p-6 space-y-6"
    >
      {/* Remove Button */}
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor={`name-${values.title}`} className="text-sm font-semibold">
          Artist Name
        </Label>
        <Input
          id={`name-${values.title}`}
          type="text"
          placeholder="Your artist name or organization"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="bg-zinc-950/40 backdrop-blur border-zinc-700/50 dark:border-zinc-600/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white placeholder-zinc-500"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Internal identifier for your NFT
        </p>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor={`title-${values.name}`} className="text-sm font-semibold">
          Title
        </Label>
        <Input
          id={`title-${values.name}`}
          type="text"
          placeholder="Display title shown in marketplace"
          value={values.title}
          onChange={(e) => handleChange("title", e.target.value)}
          className="bg-zinc-950/40 backdrop-blur border-zinc-700/50 dark:border-zinc-600/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white placeholder-zinc-500"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          This is what users will see in the marketplace
        </p>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor={`description-${values.name}`} className="text-sm font-semibold">
          Description
        </Label>
        <Textarea
          id={`description-${values.name}`}
          placeholder="Describe your creation, story, and inspiration..."
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          maxLength={500}
          className="bg-zinc-950/40 backdrop-blur border-zinc-700/50 dark:border-zinc-600/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white placeholder-zinc-500 resize-none min-h-24"
        />
        <div className="flex justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tell the story behind your creation
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {values.description.length}/500
          </p>
        </div>
      </div>

      {/* Royalty Slider */}
      <div className="space-y-3 rounded-xl backdrop-blur-md bg-cyan-500/5 border border-cyan-400/20 p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor={`royalty-${values.name}`} className="text-sm font-semibold">
            {royaltyLabel}
          </Label>
          <span className="text-base font-bold text-cyan-400 dark:text-cyan-300">
            {(values.royaltyBps / 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            id={`royalty-${values.name}`}
            type="range"
            min={0}
            max={1000}
            step={10}
            value={values.royaltyBps}
            onChange={(e) => handleChange("royaltyBps", Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none bg-linear-to-r from-cyan-500/30 to-cyan-500/50 accent-cyan-500 cursor-pointer"
          />
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 w-12 text-right">
            {values.royaltyBps} bps
          </span>
        </div>
        <p className="text-xs text-cyan-400/80 dark:text-cyan-300/80">
          Earn royalties on secondary sales (0-10%)
        </p>
      </div>

      {/* Cover Image Upload (Optional) */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Cover Image <span className="text-zinc-500">(Optional)</span>
        </Label>
        <AnimatePresence mode="wait">
          {values.coverImageUrl || coverPreview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative group"
            >
              <div className="relative h-40 w-full overflow-hidden rounded-lg border border-cyan-400/30 bg-black/40 backdrop-blur">
                <Image
                  src={
                    coverPreview ||
                    `${PINATA_GATEWAY}${values.coverImageUrl?.replace(
                      "ipfs://",
                      ""
                    )}`
                  }
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  fill
                />
                {isUploadingCover && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                      <p className="text-xs text-cyan-300 font-semibold">
                        Uploading...
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={removeCover}
                  disabled={isUploadingCover}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDrop={handleCoverDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !isUploadingCover && coverFileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-lg border-2 border-dashed border-zinc-400/30 dark:border-zinc-600/30 p-6 text-center transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5 bg-zinc-950/20 ${
                isUploadingCover ? "opacity-50" : ""
              }`}
            >
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                disabled={isUploadingCover}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverFile(file);
                }}
                className="hidden"
              />

              {isUploadingCover ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-500" />
                  <p className="text-xs text-cyan-300 font-semibold">Uploading image...</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="mx-auto h-6 w-6 text-zinc-500 dark:text-zinc-400 mb-2" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Drag & drop or click
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Max 10MB</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File Upload (Required) */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Upload File <span className="text-red-500">*</span>
        </Label>

        <AnimatePresence mode="wait">
          {values.musicTrackUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/5 backdrop-blur-lg p-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">
                      File uploaded
                    </p>
                    {values.fileType && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {values.fileType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono break-all mt-1">
                    {values.musicTrackUrl}
                  </p>
                  <button
                    onClick={() => {
                      handleChange("musicTrackUrl", "");
                      handleChange("fileType", undefined);
                    }}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Change file
                  </button>
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
                relative cursor-pointer rounded-lg border-2 border-dashed p-8 backdrop-blur-lg text-center transition-all duration-300 bg-zinc-950/20
                ${
                  isDragging
                    ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                    : "border-zinc-400/30 dark:border-zinc-600/30 hover:border-cyan-500/50 hover:bg-cyan-500/5"
                }
                ${isUploadingFile ? "pointer-events-none opacity-50" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*,image/*,.md,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                onChange={handleFileInput}
                className="hidden"
              />

              {isUploadingFile ? (
                <div className="space-y-3">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-500" />
                  <div>
                    <p className="text-xs font-semibold text-white mb-2">
                      Uploading...
                    </p>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-linear-to-r from-cyan-500 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-zinc-500 dark:text-zinc-400 mb-2" />
                  <p className="text-sm font-semibold text-white">
                    Drag & drop your file
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">or click to browse</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
