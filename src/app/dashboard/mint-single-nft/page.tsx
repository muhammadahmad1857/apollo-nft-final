"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import FileSelectInput from "@/components/ui/FileSelectInput";
import { Button } from "@/components/ui/button";
import { useMintContract } from "@/hooks/useMint";
import Image from "next/image";
import { nftABIArray, nftAddress } from "@/lib/wagmi/contracts";
import { SparklesIcon } from "@heroicons/react/24/solid";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export default function MintSingleNFTPage() {
  const { address } = useAccount();
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [royaltyBps, setRoyaltyBps] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [metaName, setMetaName] = useState<string>("");
  const [metaDesc, setMetaDesc] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [metaJson, setMetaJson] = useState<any>(null);
  const abi = nftABIArray;
  const { mint, handleToasts, isBusy } = useMintContract({ contractAddress: nftAddress, abi });

  // Update preview when file changes (fetch JSON, extract image)
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
      if (meta.image) {
        let imgUrl = meta.image;
        if (imgUrl.startsWith("ipfs://")) {
          imgUrl = `${PINATA_GATEWAY}${imgUrl.replace("ipfs://", "")}`;
        }
        setPreviewUrl(imgUrl);
      }
      setMetaName(meta.name || "");
      setMetaDesc(meta.description || "");
    } catch (e) {
      setPreviewUrl("");
      setMetaJson(null);
    }
    setIsLoadingPreview(false);
  };

  const handleRoyaltyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoyaltyBps(Number(e.target.value));
  };

  const handleMint = async () => {
    if (!selectedFile) return;
    setIsMinting(true);
    await mint({ tokenURIs: selectedFile, royaltyBps });
    setIsMinting(false);
  };

  handleToasts();

  return (
    <div className="max-w-2xl mx-auto mt-8 px-2 sm:px-6 md:px-8 w-full">
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl shadow-2xl border border-border p-6 sm:p-10 flex flex-col gap-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-8 h-8 text-primary animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary drop-shadow">Mint Single NFT</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-4">
            <label className="font-semibold text-muted-foreground">Select File</label>
            <FileSelectInput
              walletId={address || ""}
              onChange={handleFileChange}
              className="w-full"
            />
            <div className="flex flex-col gap-2 mt-2">
              <label htmlFor="royalty" className="font-semibold text-muted-foreground flex justify-between">
                Royalty: <span className="text-primary font-bold">{royaltyBps}%</span>
              </label>
              <input
                id="royalty"
                type="range"
                min={0}
                max={10}
                value={royaltyBps}
                onChange={handleRoyaltyChange}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>
            <Button
              onClick={handleMint}
              disabled={!selectedFile || isMinting || isBusy}
              className="w-full mt-4 font-bold text-lg py-3 shadow-lg hover:scale-[1.02] transition-transform duration-150"
              size="lg"
            >
              {isMinting || isBusy ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></span>
                  Minting...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                  Mint NFT
                </span>
              )}
            </Button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 w-full">
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-xs rounded-2xl border-2 border-dashed border-primary/30 bg-muted flex items-center justify-center overflow-hidden shadow-xl">
                {isLoadingPreview ? (
                  <span className="text-primary animate-pulse text-lg">Loading preview...</span>
                ) : previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="NFT Preview"
                    fill
                    className="object-contain rounded-2xl"
                  />
                ) : (
                  <span className="text-muted-foreground text-center px-4">Select a file to preview NFT image</span>
                )}
              </div>
              {metaName && (
                <div className="mt-3 text-center">
                  <div className="text-lg font-bold text-primary/90">{metaName}</div>
                  {metaDesc && <div className="text-sm text-muted-foreground mt-1">{metaDesc}</div>}
                </div>
              )}
              {metaJson && (
                <div className="w-full mt-4 bg-background/80 rounded-xl border border-border p-3 overflow-x-auto">
                  <div className="font-semibold text-primary mb-1 text-sm">Metadata JSON</div>
                  <JsonWithIpfsImages data={metaJson} />
                </div>
              )}
            </div>
          </div>
        // Helper component to render JSON with IPFS images
        function JsonWithIpfsImages({ data }: { data: any }) {
          // Recursively render JSON, showing images for IPFS fields
          if (typeof data !== "object" || data === null) {
            if (typeof data === "string" && isIpfsUrl(data)) {
              const imgUrl = data.startsWith("ipfs://")
                ? `${PINATA_GATEWAY}${data.replace("ipfs://", "")}`
                : data.startsWith("ipfs/")
                ? `${PINATA_GATEWAY}${data.replace(/^ipfs\//, "")}`
                : data;
              return (
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs text-accent-foreground break-all">{data}</span>
                  <Image src={imgUrl} alt="ipfs" width={32} height={32} className="inline rounded border border-border" />
                </span>
              );
            }
            return <span className="text-xs text-accent-foreground break-all">{JSON.stringify(data)}</span>;
          }
          if (Array.isArray(data)) {
            return (
              <span className="text-xs text-accent-foreground">[
                {data.map((item, i) => (
                  <span key={i}>
                    <JsonWithIpfsImages data={item} />{i < data.length - 1 ? ", " : ""}
                  </span>
                ))}
              ]</span>
            );
          }
          return (
            <pre className="text-xs text-accent-foreground whitespace-pre-wrap font-mono bg-background/90 rounded p-2 overflow-x-auto">
              {Object.entries(data).map(([key, value], idx) => (
                <div key={key + idx} className="flex items-start gap-2">
                  <span className="text-primary font-semibold">{key}:</span>
                  <JsonWithIpfsImages data={value} />
                </div>
              ))}
            </pre>
          );
        }

        function isIpfsUrl(val: string) {
          return typeof val === "string" && (val.startsWith("ipfs://") || val.startsWith("ipfs/"));
        }
        </div>
      </div>
    </div>
  );
}
