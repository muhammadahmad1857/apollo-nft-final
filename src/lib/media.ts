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
