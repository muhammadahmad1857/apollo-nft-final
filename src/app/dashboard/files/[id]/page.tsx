"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
// import { createClient } from "@/lib/supabase/client"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Music,
  FileVideo,
  Calendar,
  Wallet,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface FileData {
  id: string;
  created_at: string;
  wallet_id: string;
  ipfsUrl: string;
  type: string;
  isMinted: boolean;
  filename?: string | null;
}

interface MetadataContent {
  name?: string;
  title?: string;
  description?: string;
  cover?: string;
  media?: string;
}

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const fileId = params.id as string;

  const [mediaType, setMediaType] = useState<
    "audio" | "video" | "image" | "unknown"
  >("unknown");
  const [file, setFile] = useState<FileData | null>(null);
  const [metadata, setMetadata] = useState<MetadataContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !fileId) return;

    const fetchFile = async () => {
      setLoading(true);
      try {
        // const supabase = createClient();
        // const { data, error } = await supabase
        //   .from("files")
        //   .select("*")
        //   .eq("id", fileId)
        //   .eq("wallet_id", address);

        // if (error) {
        //   console.error("Error fetching file:", error);
        //   if (error.code === "PGRST116") {
        //     toast.error("File not found");
        //     router.push("/files");
        //   }
        //   setLoading(false);
        //   return;
        // }

        // if (!data || data.length === 0) {
        //   toast.error("File not found");
        //   router.push("/files");
        //   setLoading(false);
        //   return;
        // }

        // const fileData = data[0];
        // Dummy data for development
        const fileData: FileData = {
            id: fileId,
            created_at: new Date().toISOString(),
            wallet_id: address,
            ipfsUrl: "ipfs://dummy1",
            type: ".mp3",
            isMinted: false,
            filename: "track1.mp3",
            };
        // Security check - wallet ownership
        if (fileData.wallet_id.toLowerCase() !== address.toLowerCase()) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setFile(fileData);

        // Try to load metadata if it's a JSON file
        if (fileData.type === ".json") {
          try {
            const httpUrl = fileData.ipfsUrl.replace(
              "ipfs://",
              "https://gateway.pinata.cloud/ipfs/"
            );
            const metadataRes = await fetch(httpUrl);
            if (metadataRes.ok) {
              const metadataData = await metadataRes.json();
              setMetadata(metadataData);
            }
          } catch (err) {
            console.error("Failed to fetch metadata:", err);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load file");
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId, address, isConnected, router]);

  // Detect media type when file changes
  useEffect(() => {
    if (!file) return;

    const gatewayUrl = getIpfsGatewayUrl(file.ipfsUrl);

    // Quick image check by extension
    if (isImageFile(file.type)) {
      setMediaType("image");
      return;
    }

    // Audio/Video detection (HEAD request)
    if (isPotentialMediaFile(file.type)) {
      detectMediaType(gatewayUrl);
    } else {
      setMediaType("unknown");
    }
  }, [file]);

  const detectMediaType = async (url: string) => {
    if (!url) return;

    try {
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) throw new Error("HEAD request failed");

      const contentType =
        response.headers.get("content-type")?.toLowerCase() || "";

      if (contentType.startsWith("audio/")) {
        setMediaType("audio");
      } else if (contentType.startsWith("video/")) {
        setMediaType("video");
      } else {
        // Fallback to extension
        fallbackToExtension(url);
      }
    } catch (err) {
      console.warn("Media type detection failed:", err);
      fallbackToExtension(url);
    }
  };

  const fallbackToExtension = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext || "")) {
      setMediaType("audio");
    } else if (["mp4", "webm", "mov", "ogg"].includes(ext || "")) {
      setMediaType("video");
    } else {
      setMediaType("unknown");
    }
  };

  const getIpfsGatewayUrl = (ipfsUrl: string) => {
    return ipfsUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case ".mp3":
      case ".wav":
      case ".ogg":
      case ".m4a":
      case ".aac":
        return <Music className="h-8 w-8 text-cyan-500" />;
      case ".mp4":
      case ".webm":
      case ".mov":
        return <FileVideo className="h-8 w-8 text-cyan-500" />;
      case ".json":
        return <FileText className="h-8 w-8 text-cyan-500" />;
      default:
        return <FileText className="h-8 w-8 text-cyan-500" />;
    }
  };

  const isPotentialMediaFile = (type: string) =>
    [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".mp4", ".webm", ".mov"].includes(
      type
    );

  const isImageFile = (type: string) =>
    [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(type);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Please connect your wallet to view this file
            </p>
            <ConnectButton showBalance />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (unauthorized || !file) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {unauthorized
                ? "You don't have permission to view this file"
                : "File not found"}
            </p>
            <Button onClick={() => router.push("/files")}>
              Go to My Files
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const gatewayUrl = getIpfsGatewayUrl(file.ipfsUrl);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header Section */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 break-words">
                    {file.filename || `File ${file.id.slice(0, 8)}`}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge variant="outline" className="text-sm">
                      {file.type}
                    </Badge>
                    {file.isMinted ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Minted
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(gatewayUrl, "_blank")}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open IPFS
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(gatewayUrl, "_blank")}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Metadata JSON Content */}
          {file.type === ".json" && metadata && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
                Metadata Content
              </h2>
              <div className="space-y-6">
                {metadata.name && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Name
                    </h3>
                    <p className="text-lg text-zinc-900 dark:text-zinc-100">
                      {metadata.name}
                    </p>
                  </div>
                )}
                {metadata.title && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Title
                    </h3>
                    <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {metadata.title}
                    </p>
                  </div>
                )}
                {metadata.description && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Description
                    </h3>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {metadata.description}
                    </p>
                  </div>
                )}
                {metadata.cover && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                      Cover Image
                    </h3>
                    <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                      <img
                        src={getIpfsGatewayUrl(metadata.cover)}
                        alt="Cover"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <a
                      href={getIpfsGatewayUrl(metadata.cover)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-500 hover:underline mt-2 inline-block font-mono"
                    >
                      {metadata.cover}
                    </a>
                  </div>
                )}
                {metadata.media && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                      Media File
                    </h3>
                    {/* <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
                      {mediaType === "video" ? (
                        <video controls className="w-full rounded-lg" src={getIpfsGatewayUrl(metadata.media)}>
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <audio controls className="w-full" src={getIpfsGatewayUrl(metadata.media)}>
                          Your browser does not support the audio tag.
                        </audio>
                      )}
                    </div> */}
                    Media Type: {mediaType}
                    <a
                      href={getIpfsGatewayUrl(metadata.media)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-500 hover:underline mt-2 inline-block font-mono"
                    >
                      {metadata.media}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── File Preview Section ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              File Preview
            </h2>

            <div className="space-y-4">
              {mediaType === "image" && (
                <div className="relative w-full rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <img
                    src={gatewayUrl}
                    alt={file.filename || "Image preview"}
                    className="w-full h-auto object-contain max-h-[700px] mx-auto"
                    loading="lazy"
                  />
                </div>
              )}

              {mediaType === "audio" && (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
                  <audio controls className="w-full" src={gatewayUrl}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {mediaType === "video" && (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
                  <video
                    controls
                    className="w-full rounded-lg max-h-[600px]"
                    src={gatewayUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {(mediaType === "unknown" ||
                (!isPotentialMediaFile(file.type) &&
                  !isImageFile(file.type))) && (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Preview not available for this file type ({file.type})
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => window.open(gatewayUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* File Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              File Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span>Created At</span>
                </div>
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                  {new Date(file.created_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Wallet className="h-4 w-4" />
                  <span>Wallet Address</span>
                </div>
                <p className="text-zinc-900 dark:text-zinc-100 font-mono text-sm break-all">
                  {file.wallet_id}
                </p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>IPFS URL</span>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
                  <a
                    href={gatewayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-500 hover:underline font-mono text-sm break-all block"
                  >
                    {file.ipfsUrl}
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <FileText className="h-4 w-4" />
                  <span>File ID</span>
                </div>
                <p className="text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                  {file.id}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}