"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { getMediaType, isPlayableNFT } from "@/lib/media";
import { resolveIPFS } from "@/lib/ipfs";

// NFT type from the database with relations
type NFTWithRelations = {
  id: number;
  tokenId: number;
  name?: string;
  title: string;
  imageUrl?: string;
  mediaUrl?: string;
  description?: string;
  fileType?: string;
  creator?: {
    id: number;
    name: string;
    walletAddress: string;
    avatarUrl: string | null;
  };
  owner?: {
    id: number;
    name: string;
    walletAddress: string;
    avatarUrl: string | null;
  };
  auction?: unknown;
  likes?: unknown[];
};

type AudioPlayerContextType = {
  // State
  currentTrack: NFTWithRelations | null;
  queue: NFTWithRelations[];
  playlist: NFTWithRelations[];
  currentIndex: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
  currentMediaType: "audio" | "video" | "unknown";
  
  // Methods
  playSingle: (nft: NFTWithRelations) => void;
  playQueue: (nfts: NFTWithRelations[], startIndex?: number) => void;
  next: () => void;
  prev: () => void;
  playTrack: (nft: NFTWithRelations, playlist?: NFTWithRelations[]) => void;
  playAll: (playlist: NFTWithRelations[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  clearPlaylist: () => void;
  
  // Media element refs
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// REFINEMENT 1: Promise-based metadata loading - deterministic, prevents race conditions
const waitForLoadedMetadata = (mediaElement: HTMLMediaElement, timeoutMs: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    // If metadata already loaded and duration is valid, resolve immediately
    if (mediaElement.readyState >= 1 && mediaElement.duration > 0 && !isNaN(mediaElement.duration)) {
      console.log("[MEDIA] metadata already loaded, resolving immediately");
      resolve(true);
      return;
    }
    
    // Otherwise attach one-time listener
    const handleLoadedMetadata = () => {
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      console.log("[MEDIA] metadata arrived via event");
      resolve(true);
    };
    
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    
    // Reduced timeout from 15s to 5s for faster retry on stalled connections
    setTimeout(() => {
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      console.warn(`[MEDIA] metadata timeout after ${timeoutMs}ms - will retry on next attempt`);
      resolve(false);
    }, timeoutMs);
  });
};

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadAttemptRef = useRef(0);
  
  const [currentTrack, setCurrentTrack] = useState<NFTWithRelations | null>(null);
  const [playlist, setPlaylist] = useState<NFTWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMediaType, setCurrentMediaType] = useState<"audio" | "video" | "unknown">("unknown");

  const normalizeMediaUrl = useCallback((url: string | null | undefined) => {
    return resolveIPFS(url || "");
  }, []);

  const getTrackMediaType = useCallback((track: NFTWithRelations | null): "audio" | "video" | "unknown" => {
    if (!track) return "unknown";
    const mediaType = getMediaType(track);
    if (mediaType === "video") return "video";
    if (mediaType === "audio") return "audio";
    return "unknown";
  }, []);

  const getActiveMediaElement = useCallback(() => {
    return currentMediaType === "video" ? videoRef.current : audioRef.current;
  }, [currentMediaType]);

  const stopInactiveMedia = useCallback((activeType: "audio" | "video" | "unknown") => {
    if (activeType !== "audio" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    if (activeType !== "video" && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
  }, []);

  // REFINEMENT 1: Updated loadAndPlayTrack to use promise-based metadata loading
  const loadAndPlayTrack = useCallback(async (track: NFTWithRelations) => {
    const mediaType = getTrackMediaType(track);
    const resolvedMediaUrl = normalizeMediaUrl(track.mediaUrl);

    if (!resolvedMediaUrl || mediaType === "unknown") {
      console.warn("Track has unsupported or missing media source:", track);
      setError("Unsupported or missing media source");
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    setCurrentMediaType(mediaType);
    stopInactiveMedia(mediaType);

    const targetElement = mediaType === "video" ? videoRef.current : audioRef.current;

    // GUARD 1: Refs might not be mounted yet
    if (!targetElement) {
      console.warn("[MEDIA] refs not mounted - element not available yet");
      setError("Media element unavailable");
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    // GUARD 2: Prevent duplicate loads of the same URL
    if (targetElement.src === resolvedMediaUrl && targetElement.readyState >= 1) {
      console.log("[MEDIA] URL already loaded, attempting play directly");
      try {
        await targetElement.play();
        console.log("[MEDIA] play() promise resolved successfully");
        setIsLoading(false);
      } catch (err) {
        console.error("Play error:", err);
        setError("Playback failed");
        setIsPlaying(false);
        setIsLoading(false);
      }
      return;
    }

    // Start fresh load
    targetElement.src = resolvedMediaUrl;
    targetElement.preload = "metadata";
    targetElement.load();
    loadAttemptRef.current = 0;

    // Wait for metadata (5s timeout for faster retry)
    const metadataArrived = await waitForLoadedMetadata(targetElement, 5000);

    // If metadata didn't arrive, retry once before giving up
    if (!metadataArrived && loadAttemptRef.current === 0) {
      console.warn("[MEDIA] metadata timeout on first attempt, retrying...");
      loadAttemptRef.current += 1;
      await new Promise(r => setTimeout(r, 500));
      const retryMetadata = await waitForLoadedMetadata(targetElement, 5000);
      if (!retryMetadata) {
        console.error("[MEDIA] metadata still not available after retry - aborting playback");
        setError("Unable to load media metadata");
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }
    }

    // Always attempt to play once metadata is ready
    console.log("[MEDIA] attempting play after metadata ready");
    
    try {
      await targetElement.play();
      console.log("[MEDIA] play() promise resolved successfully");
      setIsLoading(false);
    } catch (err) {
      console.error("Play error:", err);
      setError("Playback failed");
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [getTrackMediaType, normalizeMediaUrl, stopInactiveMedia]);

  // Update media element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const activeElement = getActiveMediaElement();
    if (!activeElement) return;
    activeElement.playbackRate = playbackRate;
  }, [playbackRate, currentMediaType, getActiveMediaElement]);

  // Skip to next track (auto-skip non-playable)
  const playNext = useCallback(() => {
    if (playlist.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= playlist.length) {
      setIsPlaying(false);
      return;
    }

    // Find next playable track
    while (nextIndex < playlist.length) {
      const nextTrack = playlist[nextIndex];
      
      if (isPlayableNFT(nextTrack)) {
        setCurrentIndex(nextIndex);
        setCurrentTrack(nextTrack);

        loadAndPlayTrack(nextTrack);
        return;
      }

      nextIndex += 1;
    }

    console.warn("No next playable tracks found in queue");
    setIsPlaying(false);
  }, [playlist, currentIndex, loadAndPlayTrack]);

  // Skip to previous track
  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;

    // If more than 3 seconds into track, restart it
    const activeElement = getActiveMediaElement();
    if (currentTime > 3 && activeElement) {
      activeElement.currentTime = 0;
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      return;
    }

    // Find previous playable track
    while (prevIndex >= 0) {
      const prevTrack = playlist[prevIndex];
      
      if (isPlayableNFT(prevTrack)) {
        setCurrentIndex(prevIndex);
        setCurrentTrack(prevTrack);

        loadAndPlayTrack(prevTrack);
        return;
      }

      prevIndex -= 1;
    }

    console.warn("No previous playable tracks found in queue");
    setIsPlaying(false);
  }, [playlist, currentIndex, currentTime, getActiveMediaElement, loadAndPlayTrack]);

  // REFINEMENT 3 & 5: Stable event listener registration with comprehensive buffering tracking and debug logging
  // Effect ONLY depends on currentMediaType to ensure listeners registered once per element
  useEffect(() => {
    const mediaElement = getActiveMediaElement();
    if (!mediaElement) return;

    const DEBUG_MEDIA = true;  // REFINEMENT 5: Debug logging
    
    // Define handlers as stable references within the effect
    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime);
    };

    const handleDurationChange = () => {
      if (mediaElement.duration > 0 && !isNaN(mediaElement.duration)) {
        void (DEBUG_MEDIA && console.log("[MEDIA] durationchange", { duration: mediaElement.duration }));
        setDuration(mediaElement.duration);
      }
    };

    const handleLoadedMetadata = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] loadedmetadata", { duration: mediaElement.duration, readyState: mediaElement.readyState }));
      // Duration should now be valid
      if (mediaElement.duration > 0 && !isNaN(mediaElement.duration)) {
        setDuration(mediaElement.duration);
      }
    };

    const handleCanPlay = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] canplay", { readyState: mediaElement.readyState }));
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleCanPlayThrough = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] canplaythrough", { readyState: mediaElement.readyState }));
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] waiting", { readyState: mediaElement.readyState }));
      setIsBuffering(true);
    };

    const handleStalled = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] stalled", { networkState: mediaElement.networkState }));
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] playing"));
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handleEnded = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] ended"));
      if (currentIndex < playlist.length - 1) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };

    const handleLoadStart = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] loadstart"));
      setIsLoading(true);
    };

    const handlePlay = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] play"));
      setIsPlaying(true);
    };

    const handlePause = () => {
      void (DEBUG_MEDIA && console.log("[MEDIA] pause"));
      setIsPlaying(false);
    };

    const handleError = () => {
      void (DEBUG_MEDIA && console.error("[MEDIA] error", mediaElement.error));
      setError("Media failed to load");
      setIsLoading(false);
      setIsPlaying(false);
    };

    // Register all listeners at once
    mediaElement.addEventListener("timeupdate", handleTimeUpdate);
    mediaElement.addEventListener("durationchange", handleDurationChange);
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    mediaElement.addEventListener("canplay", handleCanPlay);
    mediaElement.addEventListener("canplaythrough", handleCanPlayThrough);
    mediaElement.addEventListener("waiting", handleWaiting);
    mediaElement.addEventListener("stalled", handleStalled);
    mediaElement.addEventListener("playing", handlePlaying);
    mediaElement.addEventListener("ended", handleEnded);
    mediaElement.addEventListener("loadstart", handleLoadStart);
    mediaElement.addEventListener("play", handlePlay);
    mediaElement.addEventListener("pause", handlePause);
    mediaElement.addEventListener("error", handleError);

    // CRITICAL: Cleanup function removes ALL listeners
    return () => {
      mediaElement.removeEventListener("timeupdate", handleTimeUpdate);
      mediaElement.removeEventListener("durationchange", handleDurationChange);
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      mediaElement.removeEventListener("canplay", handleCanPlay);
      mediaElement.removeEventListener("canplaythrough", handleCanPlayThrough);
      mediaElement.removeEventListener("waiting", handleWaiting);
      mediaElement.removeEventListener("stalled", handleStalled);
      mediaElement.removeEventListener("playing", handlePlaying);
      mediaElement.removeEventListener("ended", handleEnded);
      mediaElement.removeEventListener("loadstart", handleLoadStart);
      mediaElement.removeEventListener("play", handlePlay);
      mediaElement.removeEventListener("pause", handlePause);
      mediaElement.removeEventListener("error", handleError);
    };
  }, [currentMediaType, currentIndex, playlist.length, playNext, getActiveMediaElement]);

  // Play a single track
  const playTrack = useCallback((nft: NFTWithRelations, customPlaylist?: NFTWithRelations[]) => {
    if (!isPlayableNFT(nft)) {
      console.warn("NFT is not playable:", nft);
      return;
    }

    const newPlaylist = customPlaylist || [nft];
    const index = newPlaylist.findIndex(n => n.id === nft.id);
    
    setCurrentTrack(nft);
    setPlaylist(newPlaylist);
    setCurrentIndex(index);

    loadAndPlayTrack(nft);
  }, [loadAndPlayTrack]);

  const playSingle = useCallback((nft: NFTWithRelations) => {
    playTrack(nft, [nft]);
  }, [playTrack]);

  // Play all tracks in a playlist
  const playAll = useCallback((playlistToPlay: NFTWithRelations[], startIndex: number = 0) => {
    // Filter to only playable NFTs
    const playablePlaylist = playlistToPlay.filter(nft => isPlayableNFT(nft));
    
    if (playablePlaylist.length === 0) {
      console.warn("No playable tracks in playlist");
      return;
    }

    const validStartIndex = Math.max(0, Math.min(startIndex, playablePlaylist.length - 1));
    const firstTrack = playablePlaylist[validStartIndex];
    
    setPlaylist(playablePlaylist);
    setCurrentIndex(validStartIndex);
    setCurrentTrack(firstTrack);

    loadAndPlayTrack(firstTrack);
  }, [loadAndPlayTrack]);

  const playQueue = useCallback((nfts: NFTWithRelations[], startIndex: number = 0) => {
    playAll(nfts, startIndex);
  }, [playAll]);

  const next = useCallback(() => {
    playNext();
  }, [playNext]);

  const prev = useCallback(() => {
    playPrevious();
  }, [playPrevious]);


  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const activeElement = getActiveMediaElement();
    if (!activeElement) {
      console.warn("[UI] togglePlay: no active media element");
      return;
    }
    if (!currentTrack) {
      console.warn("[UI] togglePlay: no current track");
      return;
    }

    if (isPlaying) {
      console.log("[UI] pausing");
      activeElement.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      console.log("[UI] playing");
      activeElement.play()
        .then(() => {
          console.log("[UI] play() resolved");
          setIsPlaying(true);
        })
        .catch(err => {
          console.error("[UI] play error:", err);
          setIsPlaying(false);
        });
    }
  }, [isPlaying, currentTrack, getActiveMediaElement]);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const allowedRates = [0.5, 1, 1.25, 1.5, 2];
    const safeRate = allowedRates.includes(rate) ? rate : 1;
    setPlaybackRateState(safeRate);

    const activeElement = getActiveMediaElement();
    if (activeElement) {
      activeElement.playbackRate = safeRate;
    }
  }, [getActiveMediaElement]);

  // Seek to time
  const seek = useCallback((time: number) => {
    const activeElement = getActiveMediaElement();
    if (activeElement && !isNaN(duration)) {
      const clampedTime = Math.max(0, Math.min(time, duration));
      activeElement.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, [duration, getActiveMediaElement]);

  // Clear playlist and stop playback
  const clearPlaylist = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    setCurrentTrack(null);
    setPlaylist([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setCurrentMediaType("unknown");
  }, []);

  const value: AudioPlayerContextType = {
    currentTrack,
    queue: playlist,
    playlist,
    currentIndex,
    isPlaying,
    playbackRate,
    volume,
    currentTime,
    duration,
    isLoading,
    isBuffering,
    error,
    currentMediaType,
    playSingle,
    playQueue,
    next,
    prev,
    playTrack,
    playAll,
    playNext,
    playPrevious,
    togglePlay,
    setPlaybackRate,
    setVolume,
    seek,
    clearPlaylist,
    audioRef,
    videoRef,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
