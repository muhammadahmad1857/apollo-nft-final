"use client";

import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  X,
  Loader2,
  Maximize2,
  Music
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getMediaType } from "@/lib/media";
import Portal from "@/components/ui/Portal";

export function PersistentAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    isLoading,
    isBuffering,
    currentMediaType,
    togglePlay,
    playNext,
    playPrevious,
    setVolume,
    seek,
    clearPlaylist,
    audioRef,
    videoRef,
  } = useAudioPlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const inlineVideoRef = useRef<HTMLVideoElement>(null);

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle volume mute toggle
  const handleToggleMute = () => {
    if (isMuted) {
      setVolume(0.7);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    seek(newTime);
  };

  // Get media type icon/badge
  const mediaType = currentTrack ? getMediaType(currentTrack) : "unknown";

  // Get normalized image URL
  const getImageUrl = (url: string | undefined) => {
    if (!url) return null;
    return url.replace("ipfs://", `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`);
  };

  // REFINEMENT 4: Kill dual timeupdate sync - single media element source of truth
  // Inline video paused when modal closes (no event listener duplication)
  useEffect(() => {
    if (!showVideoModal && inlineVideoRef.current) {
      inlineVideoRef.current.pause();
    }
  }, [showVideoModal]);

  if (!currentTrack) return null;

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      <video ref={videoRef} preload="metadata" />

      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/95 via-black/90 to-black/80 backdrop-blur-xl border-t border-white/10 shadow-2xl"
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer hover:opacity-100"
              style={{ 
                WebkitAppearance: 'none',
                height: '8px',
                background: 'transparent'
              }}
            />
          </div>

          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Track info with media preview */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Inline Video Preview or Album Art */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-black/20 backdrop-blur border border-white/10 shadow-lg cursor-pointer group">
                  {currentMediaType === "video" ? (
                    <>
                      {/* Inline live video preview */}
                      <video
                        ref={inlineVideoRef}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div 
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/80 transition-all flex items-end justify-between p-2"
                        onClick={() => setShowVideoModal(true)}
                      >
                        <div className="flex items-center gap-1">
                          {(isLoading || isBuffering) ? (
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          ) : null}
                        </div>
                        <Maximize2 className="w-3.5 h-3.5 text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : currentTrack.imageUrl ? (
                    <>
                      <Image
                        src={getImageUrl(currentTrack.imageUrl)!}
                        alt={currentTrack.title}
                        fill
                        className="object-cover"
                      />
                      {(isLoading || isBuffering) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <Music className="w-8 h-8 text-purple-300/50" />
                      </div>
                      {(isLoading || isBuffering) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Track details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {currentTrack.title || currentTrack.name}
                  </h3>
                  <p className="text-xs text-white/60 truncate">
                    {currentTrack.creator.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 uppercase font-medium">
                      {mediaType}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={playPrevious}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                  title="Previous track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={isLoading || isBuffering}
                  className="relative p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isLoading || isBuffering ? "Loading..." : isPlaying ? "Pause" : "Play"}
                >
                  {(isLoading || isBuffering) ? (
                    <>
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    </>
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                  title="Next track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-2 flex-shrink-0 relative">
                <button
                  onClick={handleToggleMute}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="hidden sm:block p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white text-xs"
                  title="Volume"
                >
                  <span className="sr-only">Volume slider</span>
                </button>

                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 96 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 appearance-none bg-white/20 rounded-full cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Close button */}
              <button
                onClick={clearPlaylist}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white flex-shrink-0"
                title="Close player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Video Modal with Custom Controls */}
      <AnimatePresence>
        {showVideoModal && currentMediaType === "video" ? (
          <Portal>
            <motion.div
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideoModal(false)}
            >
              <motion.div 
                className="relative w-full max-w-6xl bg-gradient-to-b from-black/90 to-black/70 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="absolute top-3 right-3 z-20 p-2.5 rounded-full bg-black/80 hover:bg-black text-white/70 hover:text-white transition-all shadow-lg backdrop-blur-sm border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Video player */}
                <div className="relative bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    className="w-full h-full"
                  />
                  
                  {/* Loading overlay */}
                  {(isLoading || isBuffering) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-3" />
                      <p className="text-white/80 text-sm font-medium">Loading video...</p>
                    </div>
                  )}
                </div>

                {/* Custom timeline and controls */}
                <div className="bg-gradient-to-t from-black via-black/95 to-black/80 border-t border-white/10 p-4 space-y-3">
                  {/* Timeline */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={handleSeek}
                      className="w-full h-2 appearance-none bg-white/10 rounded-full cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(236, 72, 153) ${progress}%, rgba(255,255,255,0.1) ${progress}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                    <div className="flex justify-between items-center text-xs text-white/60">
                      <span className="font-mono">{formatTime(currentTime)}</span>
                      <span className="font-mono">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Playback controls and info */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {currentTrack.title || currentTrack.name}
                      </h3>
                      <p className="text-xs text-white/50 truncate">
                        {currentTrack.creator.name}
                      </p>
                    </div>

                    {/* Center controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={playPrevious}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={togglePlay}
                        disabled={isLoading || isBuffering}
                        className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
                      >
                        {(isLoading || isBuffering) ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </button>
                      
                      <button
                        onClick={playNext}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Volume control */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleMute}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="hidden sm:block w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        ) : null}
      </AnimatePresence>
    </>
  );
}
