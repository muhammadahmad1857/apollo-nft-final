"use client";

import { useAccount } from "wagmi";
import UniversalMediaViewer from "@/components/ui/UniversalMediaViewer";

interface NFTDetailMediaProps {
  tokenUri: string;
  mediaUrl: string;
  fileType?: string | null;
  trailer?: string | null;
  trailerFileType?: string | null;
  ownerAddress?: string | null;
}

export default function NFTDetailMedia({
  tokenUri,
  mediaUrl,
  fileType,
  trailer,
  trailerFileType,
  ownerAddress,
}: NFTDetailMediaProps) {
  const { address } = useAccount();
  const isOwner = !!address && !!ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();
  const hasTrailer = !!trailer && trailer.trim() !== "";
  const shouldShowTrailer = !isOwner && hasTrailer;

  return (
    <UniversalMediaViewer
      uri={shouldShowTrailer ? trailer : mediaUrl}
      tokenUri={tokenUri}
      fileType={shouldShowTrailer ? trailerFileType || fileType || "" : fileType || ""}
      className="w-full h-full min-h-84 sm:min-h-128 max-w-md rounded-lg shadow-lg"
      showDownload={isOwner}
    />
  );
}
