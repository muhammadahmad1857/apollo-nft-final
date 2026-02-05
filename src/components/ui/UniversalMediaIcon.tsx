"use client";
import { Music, Video, Image as ImageIcon, FileText, File, File as FileDoc, PcCaseIcon as FilePdf } from "lucide-react";
import { useEffect, useState } from "react";
import { detectFileType, resolveIpfs } from "./UniversalMediaViewer";

// ----- Icon preview component -----
interface UniversalMediaIconProps {
  tokenUri?: string; // NFT token JSON URI
  gateway?: string;
  uri?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function UniversalMediaIcon({ tokenUri, gateway,uri, className = "", style = {} }: UniversalMediaIconProps) {
  const [fileType, setFileType] = useState<string>("other");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMediaAndDetectType = async () => {
      if (!tokenUri && !uri) return;
      if(uri){
        const detected = await detectFileType(uri);
        if (isMounted) {
          setFileType(detected);
          setLoading(false);
        }
        return;
      }
      if (isMounted) setLoading(true);

      try {
        // 1️⃣ Fetch the token JSON
        const resolvedTokenUri = resolveIpfs(tokenUri as string, gateway);
        const res = await fetch(resolvedTokenUri);
        if (!res.ok) throw new Error("Failed to fetch token JSON");
        const data = await res.json();
        const mediaUri = data.media; // actual IPFS URL

        // 2️⃣ Detect file type
        const detected = await detectFileType(mediaUri);
        if (isMounted) setFileType(detected);
      } catch (err) {
        console.error("Failed to fetch or detect media type:", err);
        if (isMounted) setFileType("other");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMediaAndDetectType();

    return () => {
      isMounted = false;
    };
  }, [tokenUri, gateway, uri]);

  // ===== Loader =====
  if (loading) {
    return (
      <div
        className={`aspect-square flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-xl ${className}`}
        style={style}
      />
    );
  }

  // ===== Return icon based on type =====
  let IconComponent = File;
  const size = 120;

  if (fileType.startsWith("audio/")) IconComponent = Music;
  else if (fileType.startsWith("video/")) IconComponent = Video;
  else if (fileType.startsWith("image/")) IconComponent = ImageIcon;
  else if (fileType.startsWith("txt/")) IconComponent = FileText;
  else if (fileType === "pdf") IconComponent = FilePdf;
  else if (fileType === "doc/doc" || fileType === "doc/docx") IconComponent = FileDoc;

  return (
    <div
      className={`aspect-square flex items-center justify-center text-zinc-600 ${className}`}
      style={style}
    >
      <IconComponent size={size} strokeWidth={1} />
    </div>
  );
}
