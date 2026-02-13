"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  X,
  Image as ImageIcon,
  Loader2,
  Upload,
  SparklesIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useMintContract } from "@/hooks/useMint";
import { saveRoyalty, getRoyalty, removeRoyalty } from "@/lib/royaltySessionStorage";
import Image from "next/image";
import MintSuccessDialog from "@/components/MintSuccess";

const PINATA_GATEWAY = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`;

export default function MintPage() {
  const { address } = useAccount();
  const { mint, handleToasts, isBusy, isPriceLoading } =
    useMintContract();

  // Metadata Form State
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [musicTrackUrl, setMusicTrackUrl] = useState("");

  // Upload States
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Royalty State
  const [royaltyBps, setRoyaltyBps] = useState(
    Number(getRoyalty("SINGLE")) || 500
  );

  // Mint States
  const [isMinting, setIsMinting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Update royalty in session storage
  useEffect(() => {
    saveRoyalty(royaltyBps, "SINGLE");
  }, [royaltyBps]);

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

        setCoverImageUrl(ipfsUrl);
        toast.success("Cover image uploaded!");
      } catch (error) {
        console.error("Cover upload error:", error);
        toast.error("Failed to upload cover image");
      } finally {
        setIsUploadingCover(false);
      }
    },
    []
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
    setCoverImageUrl(undefined);
    setCoverPreview(null);
  };

  // Upload file to Pinata
  const uploadToPinata = useCallback(async (file: File) => {
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

      setUploadProgress(100);
      setMusicTrackUrl(ipfsUrl);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(0);
    }
  }, []);

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

  // Reset form
  const handleReset = () => {
    setName("");
    setTitle("");
    setDescription("");
    setCoverImageUrl(undefined);
    setCoverPreview(null);
    setMusicTrackUrl("");
    setRoyaltyBps(500);
    removeRoyalty("SINGLE");
    toast.success("Form reset");
  };

  // Handle mint
  const handleMint = async () => {
    if (!musicTrackUrl) {
      toast.error("Please upload a file to continue");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsMinting(true);

    try {
      const success = await mint({
        tokenURIs: musicTrackUrl,
        royaltyBps,
      });

      if (success) {
        setShowSuccess(true);
        removeRoyalty("SINGLE");
        handleReset();
      }
    } catch (error) {
      console.error("Mint error:", error);
    } finally {
      setIsMinting(false);
    }
  };

  handleToasts();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-300 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white">
              Create & Mint
            </h1>
            <SparklesIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-300 animate-pulse" />
          </div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your file, add metadata, and mint your unique NFT in seconds.
            No drafts—mint directly.
          </p>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl backdrop-blur-lg bg-zinc-950/20 border border-zinc-200/10 dark:border-zinc-800/30 p-8 space-y-8"
        >
          {/* Name Field */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-semibold">
              Artist Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your artist name or organization"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-950/40 backdrop-blur border-zinc-700/50 dark:border-zinc-600/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white placeholder-zinc-500"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Internal identifier for your NFT
            </p>
          </div>

          {/* Title Field */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-semibold">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Display title shown in marketplace"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-950/40 backdrop-blur border-zinc-700/50 dark:border-zinc-600/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white placeholder-zinc-500 text-lg"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This is what users will see in the marketplace
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your creation, story, and inspiration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="bg-zinc-950/40 backdrop-blur border-zinc-700/50 dark:border-zinc-600/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white placeholder-zinc-500 resize-none min-h-24"
            />
            <div className="flex justify-between">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tell the story behind your creation
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {description.length}/500
              </p>
            </div>
          </div>

          {/* Royalty Slider */}
          <div className="space-y-4 rounded-xl backdrop-blur-md bg-cyan-500/5 border border-cyan-400/20 p-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="royalty-slider" className="text-sm font-semibold">
                Royalty Percentage
              </Label>
              <span className="text-lg font-bold text-cyan-400 dark:text-cyan-300">
                {(royaltyBps / 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="royalty-slider"
                type="range"
                min={0}
                max={1000}
                step={10}
                value={royaltyBps}
                onChange={(e) => setRoyaltyBps(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none bg-linear-to-r from-cyan-500/30 to-cyan-500/50 accent-cyan-500 cursor-pointer"
              />
              <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500 w-16 text-right">
                {royaltyBps} bps
              </span>
            </div>
            <p className="text-xs text-cyan-400/80 dark:text-cyan-300/80">
              Earn royalties on secondary sales (0-10%)
            </p>
          </div>

          {/* Cover Image Upload (Optional) */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Cover Image <span className="text-zinc-500">(Optional)</span>
            </Label>
            <AnimatePresence mode="wait">
              {coverImageUrl || coverPreview ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative group"
                >
                  <div className="relative h-48 w-full overflow-hidden rounded-xl border border-cyan-400/30 bg-black/40 backdrop-blur">
                    <Image
                      src={
                        coverPreview ||
                        `${PINATA_GATEWAY}${coverImageUrl?.replace(
                          "ipfs://",
                          ""
                        )}`
                      }
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                      fill
                    />
                    <button
                      onClick={removeCover}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
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
                  onClick={() => coverFileInputRef.current?.click()}
                  className="relative cursor-pointer rounded-xl border-2 border-dashed border-zinc-400/30 dark:border-zinc-600/30 p-8 text-center transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5 bg-zinc-950/20"
                >
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverFile(file);
                    }}
                    className="hidden"
                  />

                  {isUploadingCover ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-500" />
                  ) : (
                    <>
                      <ImageIcon className="mx-auto h-8 w-8 text-zinc-500 dark:text-zinc-400 mb-2" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        Max 10MB
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File Upload (Required) */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Upload File <span className="text-red-500">*</span>
            </Label>

            <AnimatePresence mode="wait">
              {musicTrackUrl ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 backdrop-blur-lg p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-white truncate">
                          File uploaded
                        </p>
                      </div>
                      <p className="text-sm text-zinc-400 font-mono break-all">
                        {musicTrackUrl}
                      </p>
                      <button
                        onClick={() => setMusicTrackUrl("")}
                        className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Choose different file
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
                    relative cursor-pointer rounded-xl border-2 border-dashed p-12 backdrop-blur-lg text-center transition-all duration-300 bg-zinc-950/20
                    ${
                      isDragging
                        ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
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
                    <div className="space-y-4">
                      <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-500" />
                      <div>
                        <p className="text-sm font-semibold text-white mb-2">
                          Uploading to IPFS...
                        </p>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-linear-to-r from-cyan-500 to-cyan-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                          {uploadProgress}%
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-zinc-500 dark:text-zinc-400 mb-3" />
                      <p className="text-base font-semibold text-white">
                        Drag & drop your file here
                      </p>
                      <p className="text-sm text-zinc-400 mt-2">
                        or click to browse
                      </p>
                      <p className="text-xs text-zinc-500 mt-2">
                        Supports: Audio, Video, Images, PDFs, Documents • Max 100MB
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-zinc-700/50 dark:border-zinc-700/50">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl border-zinc-600/50 hover:bg-zinc-900/50 dark:hover:bg-zinc-800/50 transition-all"
            >
              Reset
            </Button>
            <Button
              onClick={handleMint}
              disabled={
                !musicTrackUrl ||
                isPriceLoading ||
                isBusy ||
                isMinting ||
                isUploadingFile ||
                !address
              }
              className="flex-1 py-3 h-auto text-base font-semibold rounded-xl bg-linear-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isBusy || isMinting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Minting...
                </span>
              ) : !address ? (
                "Connect Wallet"
              ) : (
                "Mint NFT"
              )}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Success Dialog */}
      <MintSuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
}
