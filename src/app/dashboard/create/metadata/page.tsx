"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { MetadataForm } from "@/components/create/MetadataForm";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { createFile } from "@/actions/files";

export default function MetadataPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [metadata, setMetadata] = useState<{
    name: string;
    title: string;
    description: string;
    coverImageUrl?: string;
    musicTrackUrl: string;
  }>({
    name: "",
    title: "",
    description: "",
    musicTrackUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleMetadataChange = (newMetadata: typeof metadata) => {
    setMetadata(newMetadata);
  };

  const saveMetadata = async () => {
    if (!metadata.name || !metadata.title || !metadata.musicTrackUrl) {
      toast.error("Please fill in name and music track url");
      return;
    }

    if (!address) {
      toast.error("Cannot save metadata, wallet not connected.");
      return;
    }

    setIsSaving(true);

    try {
const jwtRes = await fetch("/api/pinata/jwt", { method: "POST" });
      console.log("JWT", jwtRes);
      if (!jwtRes.ok) {
        throw new Error("Failed to get upload token");
      }
      const { JWT } = await jwtRes.json();
      // Create metadata JSON
      const metadataJSON = {
        name: metadata.name,
        title: metadata.title,
        description: metadata.description,
        cover: metadata.coverImageUrl || null,
        media: metadata.musicTrackUrl,
      };
      console.log(metadataJSON)

      // Upload metadata to Pinata with name format "name-title.json"
     
      const metadataFileName = `${metadata.name}-${metadata.title}.json`;

      const metadataUploadRes = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${JWT}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pinataMetadata: {
              name: metadataFileName,
            },
            pinataContent: metadataJSON,
          }),
        }
      );

      if (!metadataUploadRes.ok) {
        const errorText = await metadataUploadRes.text();
        throw new Error(errorText || "Failed to upload metadata");
      }

      const metadataJson = await metadataUploadRes.json();
      const metadataIpfsUrl = `ipfs://${metadataJson.IpfsHash}`;

      // Save metadata to Supabase
      const data = await createFile({
            type: ".json",
            ipfsUrl: metadataIpfsUrl,
            isMinted: false,
            filename: metadataFileName, // Save the filename (name-title.json)
            user:{
              connect:{
                walletAddress: address
              }
            }
            
        })
        

      if (!data) throw new Error("Failed to save metadata to database");

      toast.success("Metadata uploaded and saved to database!");
      // Redirect to file detail page
      if (data?.id) {
        setTimeout(() => {
          router.push(`/files/${data.id}`);
        }, 1000);
      }
    } catch (error) {
      console.log("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save metadata"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMetadata({ name: "", title: "", description: "", musicTrackUrl: "" });
    toast.info("Form reset");
  };

  const canSaveMetadata =
    metadata.name.trim() !== "" && metadata.title.trim() !== "";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {isConnected ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Create Metadata
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Create and upload metadata JSON file to Pinata and save it to
                the database
              </p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-3 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-24"
            >
              <MetadataForm
                onMetadataChange={handleMetadataChange}
                initialData={metadata}
              />
            </motion.div>

            {/* Footer Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm z-40"
            >
              <div className="mx-auto max-w-4xl px-6 py-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={saveMetadata}
                    disabled={!canSaveMetadata || isSaving}
                    className="bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Metadata"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Please connect your wallet to continue
            </p>
            <ConnectButton showBalance />
          </div>
        )}
      </div>
    </div>
  );
}