"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import FileSelectInput from "@/components/ui/FileSelectInput";
import { Button } from "@/components/ui/button";
import { useMintContract } from "@/hooks/useMint";
import Image from "next/image";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { SparklesIcon } from "lucide-react";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export default function MintSingleNFTPage() {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = useState("");
  const [royaltyBps, setRoyaltyBps] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [metaName, setMetaName] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [metaJson, setMetaJson] = useState<any>(null);

  const { mint, handleToasts, isBusy } = useMintContract({
    contractAddress: nftAddress,
    abi: nftABIArray,
  });

  const handleFileChange = async (ipfsUrl: string) => {
    setSelectedFile(ipfsUrl);
    setPreviewUrl("");
    setMetaName("");
    setMetaDesc("");
    setMetaJson(null);

    if (!ipfsUrl) return;

    setIsLoadingPreview(true);
    try {
      const url = `${PINATA_GATEWAY}${ipfsUrl.replace(/^ipfs\//, "")}`;
      const res = await fetch(url);
      const meta = await res.json();

      setMetaJson(meta);
      setMetaName(meta.name || "");
      setMetaDesc(meta.description || "");

      if (meta.image) {
        const imgUrl = meta.image.startsWith("ipfs://")
          ? `${PINATA_GATEWAY}${meta.image.replace("ipfs://", "")}`
          : meta.image;
        setPreviewUrl(imgUrl);
      }
    } catch {
      setMetaJson(null);
      setPreviewUrl("");
    }
    setIsLoadingPreview(false);
  };

  const handleMint = async () => {
    if (!selectedFile) return;
    setIsMinting(true);
    await mint({ tokenURIs: selectedFile, royaltyBps });
    setIsMinting(false);
  };

  handleToasts();

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4 w-full">
      <div className="rounded-3xl border p-8 shadow-xl flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Mint Single NFT</h1>
        </div>

        <FileSelectInput walletId={address || ""} onChange={handleFileChange} />

        <Button onClick={handleMint} disabled={!selectedFile || isBusy || isMinting}>
          {isBusy || isMinting ? "Minting..." : "Mint NFT"}
        </Button>

        <div className="w-full aspect-square max-w-xs relative border rounded-xl overflow-hidden">
          {isLoadingPreview ? (
            <span>Loading preview...</span>
          ) : previewUrl ? (
            <Image src={previewUrl} alt="preview" fill className="object-contain" />
          ) : (
            <span>No preview</span>
          )}
        </div>

        {metaJson && (
          <div className="mt-4">
            <JsonWithIpfsImages data={metaJson} />
          </div>
        )}
      </div>
    </div>
  );
}

/* =======================
   Helper Components
======================= */

function JsonWithIpfsImages({ data }: { data: any }) {
  if (typeof data !== "object" || data === null) {
    if (typeof data === "string" && isIpfsUrl(data)) {
      const imgUrl = data.startsWith("ipfs://")
        ? `${PINATA_GATEWAY}${data.replace("ipfs://", "")}`
        : `${PINATA_GATEWAY}${data.replace(/^ipfs\//, "")}`;

      return (
        <span className="flex items-center gap-2">
          <span className="text-xs break-all">{data}</span>
          <Image src={imgUrl} alt="ipfs" width={32} height={32} />
        </span>
      );
    }
    return <span className="text-xs">{JSON.stringify(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div>
        {data.map((item, i) => (
          <JsonWithIpfsImages key={i} data={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="text-xs space-y-1">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> <JsonWithIpfsImages data={value} />
        </div>
      ))}
    </div>
  );
}

function isIpfsUrl(val: string) {
  return val.startsWith("ipfs://") || val.startsWith("ipfs/");
}
