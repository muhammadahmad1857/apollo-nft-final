"use client";

import { Loader2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { resolveIPFS } from "@/lib/ipfs";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2];

export function PersistentAudioPlayer() {
  const {
    currentTrack,
    currentMediaType,
    isPlaying,
    isBuffering,
    playbackRate,
    error,
    audioRef,
    videoRef,
    togglePlay,
    next,
    prev,
    setPlaybackRate,
  } = useAudioPlayer();

  const mediaSrc = useMemo(() => resolveIPFS(currentTrack?.mediaUrl || ""), [currentTrack?.mediaUrl]);

  if (!currentTrack || !mediaSrc) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{currentTrack.title || currentTrack.name}</p>
            <p className="truncate text-xs text-zinc-400">#{currentTrack.tokenId} · {currentTrack.fileType || "unknown"}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prev} className="text-white">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="default" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={next} className="text-white">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="playback-rate" className="text-xs text-zinc-300">Speed</label>
            <select
              id="playback-rate"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
          </div>
        </div>

        {isBuffering && (
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            Buffering media...
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400">{error}</div>
        )}

        {currentMediaType === "video" ? (
          <video ref={videoRef} src={mediaSrc} controls preload="metadata" className="w-full max-h-56 rounded-md bg-black" />
        ) : (
          <audio ref={audioRef} src={mediaSrc} controls preload="metadata" className="w-full" />
        )}
      </div>
    </div>
  );
}
