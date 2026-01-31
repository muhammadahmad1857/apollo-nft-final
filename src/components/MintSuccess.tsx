"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MintSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  isBatch?: boolean;
}

export default function MintSuccessDialog({
  open,
  onClose,
  isBatch = false,
}: MintSuccessDialogProps) {
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
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-zinc-200 dark:border-zinc-700"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle2 className="w-14 h-14 text-green-500" />

              <h2 className="text-2xl font-bold">
                {isBatch ? "NFTs Minted Successfully!" : "NFT Minted Successfully!"}
              </h2>

              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your NFT{isBatch ? "s have" : " has"} been minted successfully.
                To list {isBatch ? "them" : "it"} on the marketplace, please go to
                your dashboard and update the listing.
              </p>

              <div className="flex gap-3 mt-4 w-full">
                <Link href="/dashboard" className="flex-1">
                  <Button className=" bg-cyan-600 hover:bg-cyan-700">
                    Go to Dashboard
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={onClose}
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
