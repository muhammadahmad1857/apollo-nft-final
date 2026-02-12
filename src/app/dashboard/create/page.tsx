"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Upload, FileJson, ArrowRight } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function CreatePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {isConnected ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-12"
            >
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Create New NFT
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Choose an option to get started
              </p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-3 h-0.5 bg-linear-to-r from-cyan-500 to-blue-500"
              />
            </motion.div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {/* Upload File Option */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                onClick={() => handleNavigate("/dashboard/create/upload")}
                className="group relative cursor-pointer rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-8 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                    <Upload className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Upload File
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Upload your NFT file to Pinata and save it to
                      the database
                    </p>
                  </div>
                  <div className="flex items-center text-cyan-500 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </motion.div>

              {/* Create Metadata Option */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                onClick={() => handleNavigate("/dashboard/create/metadata")}
                className="group relative cursor-pointer rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-8 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                    <FileJson className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Create Metadata
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Create and upload metadata JSON file to Pinata and save it
                      to the database
                    </p>
                  </div>
                  <div className="flex items-center text-cyan-500 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            </div>
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