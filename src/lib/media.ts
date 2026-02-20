// lib/media.ts
export async function detectMediaFromTokenURI(tokenUri: string) {
  try {
    const res = await fetch(tokenUri);
    const json = await res.json();

    const media = json.media;
    if (!media) return { type: "unknown", media: "" };

    let type = "unknown";

    // Try extension first
    if (media.endsWith(".mp4")) type = "video";
    else if (media.endsWith(".mp3") || media.endsWith(".wav")) type = "audio";
    else if (
      media.endsWith(".png") ||
      media.endsWith(".jpg") ||
      media.endsWith(".jpeg") ||
      media.endsWith(".webp")
    )
      type = "image";

    return { type, media };
  } catch (e) {
    console.error("Media detection failed", e);
    return { type: "unknown", media: "" };
  }
}

/**
 * Check if an NFT is playable (audio or video)
 */
export function isPlayableNFT(nft: { fileType?: string | null; mediaUrl?: string | null }): boolean {
  if (!nft.fileType && !nft.mediaUrl) return false;
  
  // Check fileType for audio or video MIME types
  if (nft.fileType) {
    const fileType = nft.fileType.toLowerCase();
    if (fileType.startsWith("audio/") || fileType.startsWith("video/")) {
      return true;
    }
  }
  
  // Fallback: check mediaUrl extension
  if (nft.mediaUrl) {
    const url = nft.mediaUrl.toLowerCase();
    const playableExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".mp4", ".webm", ".mov"];
    return playableExtensions.some(ext => url.endsWith(ext));
  }
  
  return false;
}

/**
 * Get media type from NFT (audio, video, image, document, unknown)
 */
export function getMediaType(nft: { fileType?: string | null; mediaUrl?: string | null }): string {
  if (nft.fileType) {
    const fileType = nft.fileType.toLowerCase();
    if (fileType.startsWith("audio/")) return "audio";
    if (fileType.startsWith("video/")) return "video";
    if (fileType.startsWith("image/")) return "image";
    if (fileType.includes("pdf") || fileType.includes("document")) return "document";
  }
  
  if (nft.mediaUrl) {
    const url = nft.mediaUrl.toLowerCase();
    if ([".mp3", ".wav", ".ogg", ".m4a"].some(ext => url.endsWith(ext))) return "audio";
    if ([".mp4", ".webm", ".mov"].some(ext => url.endsWith(ext))) return "video";
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].some(ext => url.endsWith(ext))) return "image";
    if ([".pdf", ".doc", ".docx"].some(ext => url.endsWith(ext))) return "document";
  }
  
  return "unknown";
}
