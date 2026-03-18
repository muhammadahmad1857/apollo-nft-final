"use client";

import { useState } from "react";
import { AlertCircle, Cloud, CheckCircle2, X } from "lucide-react";
import { useProcessingNFTs, type ProcessingNFT } from "@/hooks/useProcessingNFTs";
import { cn } from "@/lib/utils";

interface ProcessingBannerProps {
  walletAddress?: string | null;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex-1 max-w-[80px] h-1 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-amber-400 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function NFTRow({ nft }: { nft: ProcessingNFT }) {
  const mainFile = nft.files.find((f) => f.role === "MAIN");
  const overallFailed =
    nft.readinessStatus === "FAILED" || mainFile?.uploadStatus === "FAILED";
  const progress = mainFile?.uploadProgress ?? 0;
  const statusLabel = overallFailed
    ? "Failed"
    : mainFile?.uploadStatus === "COMPLETED"
    ? "Done"
    : `${progress}%`;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-zinc-400 truncate max-w-[180px]">
        {nft.title || `NFT #${nft.tokenId}`}
      </span>
      <span
        className={cn(
          "text-xs px-1.5 py-0.5 rounded font-medium shrink-0",
          overallFailed
            ? "bg-red-500/20 text-red-400"
            : mainFile?.uploadStatus === "COMPLETED"
            ? "bg-green-500/20 text-green-400"
            : "bg-amber-500/20 text-amber-400"
        )}
      >
        {statusLabel}
      </span>
      {!overallFailed && mainFile?.uploadStatus !== "COMPLETED" && (
        <ProgressBar value={progress} />
      )}
    </div>
  );
}

export function ProcessingBanner({ walletAddress }: ProcessingBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { data: nfts = [] } = useProcessingNFTs(walletAddress);

  if (!nfts.length || dismissed) return null;

  const hasFailures = nfts.some(
    (n) =>
      n.readinessStatus === "FAILED" ||
      n.files.some((f) => f.uploadStatus === "FAILED")
  );
  const allDone = nfts.every((n) =>
    n.files.every((f) => f.uploadStatus === "COMPLETED")
  );

  const headerText = hasFailures
    ? `${nfts.filter((n) => n.readinessStatus === "FAILED").length} upload${nfts.length > 1 ? "s" : ""} failed`
    : allDone
    ? "Upload processing complete"
    : `${nfts.length} NFT${nfts.length > 1 ? "s" : ""} uploading in the background`;

  return (
    <div className="w-full border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-0.5 shrink-0">
            {hasFailures ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : allDone ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <Cloud className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{headerText}</p>

            <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1">
              {nfts.slice(0, 6).map((nft) => (
                <NFTRow key={nft.id} nft={nft} />
              ))}
              {nfts.length > 6 && (
                <span className="text-xs text-zinc-500">
                  and {nfts.length - 6} more…
                </span>
              )}
            </div>

            {!hasFailures && !allDone && (
              <p className="text-xs text-zinc-500 mt-1.5">
                Uploads continue on the server — you can safely close this tab.
              </p>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="shrink-0 p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
