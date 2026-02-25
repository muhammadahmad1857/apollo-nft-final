"use client";

import { Loader2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useMemo, useState } from "react";
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
    isLoading,
    playbackRate,
    error,
    audioRef,
    videoRef,
    togglePlay,
    next,
    prev,
    setPlaybackRate,
    clearPlaylist,
  } = useAudioPlayer();

  const [showVideo, setShowVideo] = useState(true);
  const mediaSrc = useMemo(() => resolveIPFS(currentTrack?.mediaUrl || ""), [currentTrack?.mediaUrl]);

  if (!currentTrack || !mediaSrc) {
    return null;
  }

  // Only show actual playback errors, not loading states
  const shouldShowError = error && !isLoading && !isBuffering && error !== "Media element unavailable";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/80 bg-gradient-to-t from-black/95 to-black/90 backdrop-blur-lg shadow-2xl">
      <div className="mx-auto max-w-7xl">
        {/* Compact Player Bar */}
        <div className="flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3">
          {/* Track Info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white sm:text-sm">
                {currentTrack.title || currentTrack.name}
              </p>
              <p className="truncate text-[10px] text-zinc-400 sm:text-xs">
                #{currentTrack.tokenId}
                {isBuffering && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Buffering...
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              className="h-8 w-8 p-0 text-white hover:bg-white/10"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={togglePlay}
              className="h-9 w-9 rounded-full bg-white p-0 text-black hover:bg-white/90 hover:scale-105 transition-transform"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={next}
              className="h-8 w-8 p-0 text-white hover:bg-white/10"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Speed Control & Close */}
          <div className="hidden items-center gap-2 sm:flex">
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="h-7 rounded-md border border-zinc-700/50 bg-zinc-900/50 px-2 text-xs text-white hover:border-zinc-600 focus:border-white focus:outline-none"
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
            {currentMediaType === "video" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideo(!showVideo)}
                className="h-7 px-2 text-[10px] text-zinc-300 hover:bg-white/10"
              >
                {showVideo ? "Hide" : "Show"}
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearPlaylist}
            className="h-8 w-8 p-0 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Error Display (only actual errors) */}
        {shouldShowError && (
          <div className="border-t border-red-900/30 bg-red-950/30 px-4 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Video Player (collapsible) */}
        {currentMediaType === "video" && showVideo && (
          <div className="border-t border-zinc-800/50 bg-black p-2">
            <video
              ref={videoRef}
              src={mediaSrc}
              controls
              preload="metadata"
              className="mx-auto w-full max-w-2xl rounded-md bg-black"
              style={{ maxHeight: '240px' }}
            />
          </div>
        )}

        {/* Hidden Audio Element */}
        {currentMediaType === "audio" && (
          <audio ref={audioRef} src={mediaSrc} preload="metadata" className="hidden"   controlsList="nodownload"
 />
        )}
      </div>
    </div>
  );
}
