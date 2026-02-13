"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MintSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  isBatch?: boolean;
  tokenId?: number; // NFT token ID for navigation
}

export default function MintSuccessDialog({
  open,
  onClose,
  isBatch = false,
  tokenId,
}: MintSuccessDialogProps) {
  const router = useRouter();

  const handleCreateAuction = () => {
    if (tokenId) {
      router.push(`/dashboard/create-auction/${tokenId}`);
      onClose();
    }
  };

  const handleListMarketplace = () => {
    if (tokenId) {
      router.push(`/dashboard/list-marketplace/${tokenId}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex flex-col items-center text-center gap-6">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </motion.div>

              {/* Title */}
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {isBatch ? "NFTs Minted Successfully!" : "NFT Minted Successfully!"}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  Your NFT{isBatch ? "s are" : " is"} ready. What would you like to do next?
                </p>
              </div>

              {/* Action Buttons */}
              {!isBatch && tokenId && (
                <div className="w-full space-y-3 mt-2">
                  {/* Create Auction Button */}
                  <Button
                    onClick={handleCreateAuction}
                    className="w-full h-14 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Auction
                  </Button>

                  {/* List on Marketplace Button */}
                  <Button
                    onClick={handleListMarketplace}
                    className="w-full h-14 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                    <Store className="w-5 h-5 mr-2" />
                    List on Marketplace
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">or</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent" />
                  </div>
                </div>
              )}

              {/* Close/Dashboard Buttons */}
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => {
                    router.push("/dashboard");
                    onClose();
                  }}
                  variant="outline"
                  className="flex-1 h-12 border-2 border-zinc-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl font-semibold transition-all"
                >
                  Go to Dashboard
                </Button>

                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
