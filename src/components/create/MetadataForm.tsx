"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import FileSelectInput from "../ui/FileSelectInput";


import type { MetadataFormValues } from "@/types";
interface MetadataFormProps {
  onMetadataChange: (metadata: MetadataFormValues) => void;
  initialData?: MetadataFormValues;
  setDisabled: (disabled: boolean) => void;
}

export function MetadataForm({
  onMetadataChange,
  initialData,
  setDisabled,
}: MetadataFormProps) {
  const { address } = useAccount();
  const [name, setName] = useState(initialData?.name || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.coverImageUrl
  );
  const [musicTrackUrl, setMusicTrackUrl] = useState(
    initialData?.musicTrackUrl || ""
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = () => {
    console.log("Setting metadata to ", musicTrackUrl)
    onMetadataChange({
      name,
      title,
      description,
      coverImageUrl,
      musicTrackUrl,
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const uploadCoverImage = async (file: File) => {
    try {
 // 1️⃣ Get signed URL from your server
 setIsUploadingCover(true);
 setDisabled(true)
    
    const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
      console.log("JWT", jwtRes);
      if (!jwtRes.ok) {
        throw new Error("Failed to get upload token");
      }
      const { JWT } = await jwtRes.json();
           const formData = new FormData();
      formData.append("file", file);
      formData.append("network","public")

  
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
      const json = await uploadRes.json();
      console.log("uploadRes.json()", json);
      const ipfsHash = json.IpfsHash;
      const ipfsUrl = `ipfs://${ipfsHash}`;
   
      
       onMetadataChange({
                name,
                title,
                description,
                coverImageUrl: ipfsUrl,
                musicTrackUrl,           // ← use url here, not musicTrackUrl
              });
      setCoverImageUrl(ipfsUrl);
      toast.success("Cover image uploaded!");
    } catch (error) {
      console.log("Cover upload error:", error);
      toast.error("Failed to upload cover image");
    } finally {
      setIsUploadingCover(false);
       setDisabled(false)

    }
  };

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
    handleFieldChange();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Internal name (e.g., my-music-001)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            // handleFieldChange();
             onMetadataChange({
                name:e.target.value,
                title,
                description,
                coverImageUrl,
                musicTrackUrl: musicTrackUrl,           // ← use url here, not musicTrackUrl
              });
          }}
          className="bg-transparent"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Used internally or as NFT identifier
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Display title (shown in marketplace)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
             onMetadataChange({
                name,
                title:e.target.value,
                description,
                coverImageUrl,
                musicTrackUrl,           // ← use url here, not musicTrackUrl
              });
          }}
          className="bg-transparent text-lg"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          This is what users will see
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your music NFT..."
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setDescription(e.target.value);
            // handleFieldChange();
               onMetadataChange({
                name,
                title,
                description:e.target.value,
                coverImageUrl,
                musicTrackUrl,           // ← use url here, not musicTrackUrl
              });
          }}
          maxLength={500}
          className="bg-transparent resize-none"
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

      <div className="space-y-2">
        <Label>Cover Image (Optional)</Label>
        <AnimatePresence mode="wait">
          {coverImageUrl || coverPreview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative group"
            >
              <div className="relative h-48 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <img
                  src={
                    coverPreview ||
                    `https://yellow-random-swordfish-139.mypinata.cloud/ipfs/${coverImageUrl?.replace(
                      "ipfs://",
                      ""
                    )}`
                  }
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={removeCover}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {coverImageUrl}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDrop={handleCoverDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center transition-all hover:border-cyan-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <input
                ref={fileInputRef}
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
                  <ImageIcon className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Drag & drop or click to upload
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <Label htmlFor="music-track">Music track</Label>
        {address ? (
          <FileSelectInput
            walletId={address}
            fileExtensions={[".mp3", ".mp4"]}
            onChange={(url) => {
              console.log("Our music track url", url);
              setMusicTrackUrl(url);
              console.log("set", musicTrackUrl);

              onMetadataChange({
                name,
                title,
                description,
                coverImageUrl,
                musicTrackUrl: url,           // ← use url here, not musicTrackUrl
              });
            }}
            className="w-full"
          />
        ) : (
          <p className="text-sm text-zinc-500">
            Please connect your wallet to select a music track.
          </p>
        )}
        {musicTrackUrl && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {musicTrackUrl}
          </p>
        )}
      </div>
    </div>
  );
}