"use client";

import { useQuery } from "@tanstack/react-query";

export interface ProcessingFile {
  id: string;
  role: "MAIN" | "COVER" | "TRAILER";
  uploadStatus: "PENDING" | "UPLOADING" | "COMPLETED" | "FAILED";
  uploadProgress: number;
  filename: string;
  failureReason: string | null;
}

export interface ProcessingNFT {
  id: number;
  tokenId: number;
  title: string;
  imageUrl: string;
  readinessStatus: "PROCESSING" | "FAILED";
  files: ProcessingFile[];
}

async function fetchProcessingNFTs(wallet: string): Promise<ProcessingNFT[]> {
  const res = await fetch(
    `/api/nfts/processing?wallet=${encodeURIComponent(wallet)}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.nfts ?? []) as ProcessingNFT[];
}

export function useProcessingNFTs(walletAddress?: string | null) {
  return useQuery<ProcessingNFT[]>({
    queryKey: ["processing-nfts", walletAddress],
    queryFn: () => fetchProcessingNFTs(walletAddress!),
    enabled: !!walletAddress,
    refetchInterval: 5000,
    staleTime: 3000,
    placeholderData: [],
  });
}
