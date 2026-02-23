"use client";

import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { isPlayableNFT } from "@/lib/media";

type PlaylistNFT = {
  id: number;
  title: string;
  tokenId: number;
  fileType: string;
  mediaUrl?: string;
};

type PlaylistViewProps = {
  items: PlaylistNFT[];
  mode: "audio" | "video" | "all";
  view: "grid" | "list";
};

export function PlaylistView({ items, mode, view }: PlaylistViewProps) {
  const { playSingle, playQueue } = useAudioPlayer();

  const playable = items.filter((item) => {
    if (!isPlayableNFT(item)) return false;
    const fileType = (item.fileType || "").toLowerCase();
    if (mode === "audio") return fileType.startsWith("audio");
    if (mode === "video") return fileType.startsWith("video");
    return fileType.startsWith("audio") || fileType.startsWith("video");
  });

  if (playable.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-yellow-500/30 bg-yellow-500/5 p-8 text-center">
        <PlayCircle className="mb-2 h-12 w-12 text-yellow-500/40" />
        <p className="font-medium text-yellow-500">No playable media found</p>
        <p className="mt-1 text-xs text-zinc-400">
          {mode === "all" 
            ? "This playlist contains no audio or video files"
            : `No ${mode} files in this playlist`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => playQueue(playable)}>
        <PlayCircle className="mr-2 h-4 w-4" />
        Play All ({playable.length})
      </Button>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playable.map((item) => (
            <button
              key={item.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-left"
              onClick={() => playSingle(item)}
            >
              <p className="truncate text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-zinc-400">#{item.tokenId} · {item.fileType}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {playable.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-left"
              onClick={() => playSingle(item)}
            >
              <span className="truncate text-sm text-white">{item.title}</span>
              <span className="text-xs text-zinc-400">{item.fileType}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
