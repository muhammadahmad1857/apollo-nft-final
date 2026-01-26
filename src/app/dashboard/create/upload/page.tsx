"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/create/fileUpload";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function UploadPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<{
    ipfsUrl: string;
    type: ".mp3" | ".mp4" | ".wav";
    name: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = async (
    ipfsUrl: string,
    fileType: ".mp3" | ".mp4" | ".wav",
    fileName: string
  ) => {
    setUploadedFile({ ipfsUrl, type: fileType, name: fileName });
    if (!address) {
      toast.error("Cannot save file, wallet not connected.");
      return;
    }

    setIsSaving(true);
    try {
    //   const supabase = createClient();
    //   const { data, error } = await supabase
    //     .from("files")
    //     .insert({
    //       wallet_id: address,
    //       ipfsUrl: ipfsUrl,
    //       type: fileType,
    //       isMinted: false,
    //       filename: fileName, // Save original filename from desktop
    //     })
    //     .select()
    //     .single();

    //   if (error) {
    //     throw error;
    //   }

setTimeout(() => {
    toast.success("File uploaded and saved to database!");
          router.push(`/files/`);
        }, 1000);
      // Redirect to file detail page
    //   if (data?.id) {
        
    //   }
    } catch (error) {
      console.error("Failed to save file", error);
      toast.error("Failed to save file. Please try again.");
      setUploadedFile(null); // Reset on failure
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    toast.info("Form reset");
  };

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
                Upload File
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Upload your music or video file to Pinata and save it to the
                database
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
              className="mb-8"
            >
              <FileUpload
                onUploadComplete={handleFileUpload}
                uploadedFile={uploadedFile}
              />
            </motion.div>

            {/* Footer Actions */}
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
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
                    <div className="flex items-center gap-2">
                      {isSaving && (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            Saving...
                          </span>
                        </>
                      )}
                      {!isSaving && uploadedFile && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          File saved successfully!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
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