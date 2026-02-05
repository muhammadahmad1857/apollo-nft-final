"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Play, X, FileText, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getFileTypeByIPFS } from "@/actions/files";

interface UniversalMediaViewerProps {
  tokenUri?: string; // now we pass the NFT token URI (points to JSON)
  gateway?: string; // e.g. gateway.pinata.cloud
  className?: string;
  style?: React.CSSProperties;
  uri?: string; 
}

export function resolveIpfs(uri: string, gateway = process.env.NEXT_PUBLIC_GATEWAY_URL) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return `https://${gateway}/ipfs/${uri.replace("ipfs://", "")}`;
  }
  return uri;
}

// Helper to detect type
export async function detectFileType(uri: string): Promise<string> {
  const { type, name } = await getFileTypeByIPFS(uri);
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const mime = type.toLowerCase();

  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg"].includes(ext)) return `audio/${ext || mime.split("/")[1]}`;
  if (mime.startsWith("video/") || ["mp4", "mov", "webm"].includes(ext)) return `video/${ext || mime.split("/")[1]}`;
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return `image/${ext || mime.split("/")[1]}`;
  if (["txt", "md"].includes(ext) || mime === "text/plain" || mime === "text/markdown") return ext === "md" ? "txt/md" : "txt/txt";
  if (ext === "doc" || mime === "application/msword") return "doc/doc";
  if (ext === "docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "doc/docx";
  if (ext === "pdf" || mime === "application/pdf" || mime === "pdf") return "pdf";

  return "other";
}

export default function UniversalMediaViewer({
  tokenUri,
  uri,
  gateway,
  className = "",
  style = {},
}: UniversalMediaViewerProps) {
  const [mediaUri, setMediaUri] = useState<string>(""); // actual media url
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState<string>("");
  const [fileType, setFileType] = useState<string>("other");
  const [loading, setLoading] = useState(true);

  // Fetch the media URI, prioritizing 'uri' over 'tokenUri'
  useEffect(() => {
    setLoading(true);

    const fetchMedia = async () => {
      try {
        if (uri) {
          setMediaUri(uri);
          return;
        }
        if (tokenUri) {
          const resolvedUri = resolveIpfs(tokenUri, gateway);
          const res = await fetch(resolvedUri);
          if (!res.ok) throw new Error("Failed to fetch token JSON");
          const data = await res.json();
          const media = data.media; // this should be ipfs://... or https://...
          setMediaUri(media);
        } else {
          setMediaUri("");
        }
      } catch (err) {
        console.error("Failed to load token JSON:", err);
        setMediaUri("");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [tokenUri, gateway, uri]);

  // Detect file type once mediaUri is available
  useEffect(() => {
    if (!mediaUri) return;
    setLoading(true);
    detectFileType(mediaUri)
      .then((detected) => setFileType(detected))
      .catch(() => setFileType("other"))
      .finally(() => setLoading(false));
  }, [mediaUri]);

  const src = resolveIpfs(mediaUri, gateway);

  const isVideo = fileType.startsWith("video/");
  const isAudio = fileType.startsWith("audio/");
  const isImage = fileType.startsWith("image/");
  const isTxt = fileType.startsWith("txt/");
  const isPdf = fileType === "pdf";
  const isDoc = fileType === "doc/doc";
  const isDocx = fileType === "doc/docx";

  // Load text if needed
  useEffect(() => {
    if (isTxt && src) {
      setLoading(true);
      fetch(src)
        .then((res) => res.text())
        .then(setText)
        .catch(() => setText("Failed to load text file."))
        .finally(() => setLoading(false));
    }
  }, [isTxt, src]);

  if (loading) {
    return (
      <div
        className={`w-full h-64 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-xl ${className}`}
        style={style}
      />
    );
  }
  // ===== Image =====
  if (isImage) {
    return (
      <div
        className={`relative w-full h-64 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden ${className}`}
        style={style}
      >
        <Image
          src={src}
          alt="media"
          fill
          className="object-contain cursor-pointer"
          onClick={() => setShowModal(true)}
        />
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70"
                  onClick={() => setShowModal(false)}
                >
                  <X size={24} />
                </Button>
                <Image src={src} alt="media" width={900} height={600} className="w-full h-auto rounded-xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ===== Video =====
  if (isVideo) {
    return (
      <div
        className={`relative w-full h-64 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden ${className}`}
        style={style}
      >
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={() => setShowModal(true)}
        >
          <Play size={20} />
        </Button>
        <video src={src} className="w-full h-full object-contain rounded-xl" controls={false} />
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70"
                  onClick={() => setShowModal(false)}
                >
                  <X size={24} />
                </Button>
                <video src={src} controls autoPlay className="w-full h-full rounded-xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ===== Audio =====
  if (isAudio) {
    return (
      <div
        className={`w-full flex flex-col items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 ${className}`}
        style={style}
      >
        <audio controls className="w-full">
          <source src={src} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

 // ===== PDF =====
if (isPdf) {
  return (
    <>
      <div
        className={`relative w-full h-96 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden cursor-pointer ${className}`}
        style={style}
        onClick={() => setShowModal(true)}
      >
        <iframe
          src={src}
          title="PDF Preview"
          className="w-full h-full border-none rounded-xl pointer-events-none"
        />
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <div className="relative w-full max-w-5xl h-full" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70"
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </Button>
              <iframe
                src={src}
                title="PDF Fullscreen"
                className="w-full h-full border-none rounded-xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


  // ===== Word (.doc/.docx) =====
  if (isDoc || isDocx) {
    const googleViewer = `https://docs.google.com/gview?url=${encodeURIComponent(src)}&embedded=true`;
    return (
      <div
        className={`w-full h-96 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden ${className}`}
        style={style}
      >
        <iframe src={googleViewer} title="Word Preview" className="w-full h-full border-none rounded-xl" />
      </div>
    );
  }

  // ===== Text (.txt/.md) =====
  if (isTxt) {
    return (
      <div
        className={`w-full h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-auto p-4 font-mono text-sm ${className}`}
        style={style}
      >
        <FileText className="mb-2 text-zinc-400" />
        <pre>{text}</pre>
      </div>
    );
  }

  // ===== Fallback =====
  return (
    <div
      className={`w-full h-32 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl ${className}`}
      style={style}
    >
      <File size={40} className="text-zinc-400 mb-2" />
      <span className="text-zinc-500">Unsupported file type</span>
    </div>
  );
}
