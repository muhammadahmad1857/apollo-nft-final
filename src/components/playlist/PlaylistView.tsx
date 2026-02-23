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

  // Filter items based on mode
  const filteredItems = items.filter((item) => {
    const fileType = (item.fileType || "").toLowerCase();
    if (mode === "audio") return fileType.startsWith("audio");
    if (mode === "video") return fileType.startsWith("video");
    return true; // show all in "all" mode
  });

  // Get playable items for Play All button
  const playable = filteredItems.filter((item) => isPlayableNFT(item));
  const hasNonPlayable = filteredItems.length > playable.length;

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-8 text-center">
        <PlayCircle className="mb-3 h-12 w-12 text-zinc-600" />
        <p className="font-medium text-zinc-400">No items in this filter</p>
        <p className="mt-1 text-xs text-zinc-500">
          {mode === "all" 
            ? "This playlist is empty"
            : `No ${mode} files in this playlist`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Warning + Play All */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {hasNonPlayable && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
            <p className="text-xs text-yellow-500">
              ⚠️ {filteredItems.length - playable.length} non-playable item{filteredItems.length - playable.length !== 1 ? 's' : ''} in this list
            </p>
          </div>
        )}
        {playable.length > 0 && (
          <Button 
            onClick={() => playQueue(playable)}
            className="w-full sm:w-auto"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Play All ({playable.length})
          </Button>
        )}
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const playable = isPlayableNFT(item);
            return (
              <button
                key={item.id}
                className={`rounded-lg border p-3 text-left transition-all ${
                  playable
                    ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/60"
                    : "border-zinc-800/50 bg-zinc-900/20 opacity-60 cursor-not-allowed"
                }`}
                onClick={() => playable && playSingle(item)}
                disabled={!playable}
              >
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-zinc-400">
                  #{item.tokenId} · {item.fileType}
                  {!playable && <span className="ml-1 text-yellow-500">🔒</span>}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filteredItems.map((item) => {
            const playable = isPlayableNFT(item);
            return (
              <button
                key={item.id}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                  playable
                    ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/60"
                    : "border-zinc-800/50 bg-zinc-900/20 opacity-60 cursor-not-allowed"
                }`}
                onClick={() => playable && playSingle(item)}
                disabled={!playable}
              >
                <span className="truncate text-sm text-white">
                  {item.title}
                  {!playable && <span className="ml-2 text-yellow-500 text-xs">🔒 Not playable</span>}
                </span>
                <span className="ml-2 shrink-0 text-xs text-zinc-400">{item.fileType}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
