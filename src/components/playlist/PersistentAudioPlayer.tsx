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
  Loader2
} from "lucide-react";
import { useState } from "react";
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
                {/* Media thumbnail */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 cursor-pointer group">
                  {currentMediaType === "video" && currentTrack.imageUrl ? (
                    <>
                      <Image
                        src={getImageUrl(currentTrack.imageUrl)!}
                        alt={currentTrack.title}
                        fill
                        className="object-cover group-hover:brightness-75 transition-all"
                      />
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all"
                        onClick={() => setShowVideoModal(true)}
                      >
                        <Play className="w-6 h-6 text-white fill-white opacity-80 group-hover:opacity-100 ml-1" />
                      </div>
                    </>
                  ) : currentMediaType === "video" && !currentTrack.imageUrl ? (
                    <>
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/40 to-pink-500/40">
                        <span className="text-xl">🎬</span>
                      </div>
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all"
                        onClick={() => setShowVideoModal(true)}
                      >
                        <Play className="w-6 h-6 text-white fill-white opacity-80 group-hover:opacity-100 ml-1" />
                      </div>
                    </>
                  ) : currentTrack.imageUrl ? (
                    <Image
                      src={getImageUrl(currentTrack.imageUrl)!}
                      alt={currentTrack.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
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
                  disabled={isLoading}
                  className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white fill-white" />
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

      {/* Video fullscreen modal - inspired by UniversalMediaViewer */}
      <AnimatePresence>
        {showVideoModal && currentMediaType === "video" ? (
          <Portal>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xl flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideoModal(false)}
            >
              <div 
                className="relative w-full max-w-5xl bg-black/80 rounded-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Video player with controls */}
                <div className="relative bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full"
                  />
                </div>

                {/* Track info */}
                <div className="p-4 bg-black/50 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white">
                    {currentTrack.title || currentTrack.name}
                  </h3>
                  <p className="text-xs text-white/60">
                    {currentTrack.creator.name}
                  </p>
                </div>
              </div>
            </motion.div>
          </Portal>
        ) : null}
      </AnimatePresence>
    </>
  );
}
