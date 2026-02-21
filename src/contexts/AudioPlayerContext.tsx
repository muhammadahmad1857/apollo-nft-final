"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { getMediaType, isPlayableNFT } from "@/lib/media";

// NFT type from the database with relations
type NFTWithRelations = {
  id: number;
  tokenId: number;
  name: string;
  title: string;
  imageUrl: string;
  mediaUrl: string;
  description: string;
  fileType: string;
  creator: {
    id: number;
    name: string;
    walletAddress: string;
    avatarUrl: string | null;
  };
  owner: {
    id: number;
    name: string;
    walletAddress: string;
    avatarUrl: string | null;
  };
  auction: unknown;
  likes: unknown[];
};

type AudioPlayerContextType = {
  // State
  currentTrack: NFTWithRelations | null;
  playlist: NFTWithRelations[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isBuffering: boolean;
  currentMediaType: "audio" | "video" | "unknown";
  
  // Methods
  playTrack: (nft: NFTWithRelations, playlist?: NFTWithRelations[]) => void;
  playAll: (playlist: NFTWithRelations[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  clearPlaylist: () => void;
  
  // Media element refs
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// REFINEMENT 1: Promise-based metadata loading - deterministic, prevents race conditions
const waitForLoadedMetadata = (mediaElement: HTMLMediaElement): Promise<void> => {
  return new Promise((resolve) => {
    // If metadata already loaded and duration is valid, resolve immediately
    if (mediaElement.readyState >= 1 && mediaElement.duration > 0 && !isNaN(mediaElement.duration)) {
      resolve();
      return;
    }
    
    // Otherwise attach one-time listener
    const handleLoadedMetadata = () => {
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      resolve();
    };
    
    mediaElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    
    // Safety timeout: if metadata doesn't arrive in 15s, resolve anyway (corrupted file)
    setTimeout(() => {
      mediaElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      resolve();
    }, 15000);
  });
};

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [currentTrack, setCurrentTrack] = useState<NFTWithRelations | null>(null);
  const [playlist, setPlaylist] = useState<NFTWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentMediaType, setCurrentMediaType] = useState<"audio" | "video" | "unknown">("unknown");

  const normalizeMediaUrl = useCallback((url: string | null | undefined) => {
    if (!url) return "";

    if (url.startsWith("ipfs://")) {
      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;
      if (!gatewayUrl) {
        return url;
      }
      return url.replace("ipfs://", `https://${gatewayUrl}/ipfs/`);
    }

    return url;
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
      setIsPlaying(false);
      return;
    }

    setCurrentMediaType(mediaType);
    stopInactiveMedia(mediaType);

    const targetElement = mediaType === "video" ? videoRef.current : audioRef.current;

    if (!targetElement) {
      console.warn("Media element is not mounted yet");
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    if (targetElement.src !== resolvedMediaUrl) {
      targetElement.src = resolvedMediaUrl;
      targetElement.preload = "auto";  // Switch to auto after user initiates
      targetElement.load();
    }

    // DETERMINISTIC: Wait for metadata before playing
    await waitForLoadedMetadata(targetElement);

    // Only play if still the current track (user didn't switch)
    if (currentTrack?.id === track.id) {
      targetElement.play().catch(err => {
        console.error("Play error:", err);
        setIsPlaying(false);
      });
    }
  }, [getTrackMediaType, normalizeMediaUrl, stopInactiveMedia, currentTrack?.id]);

  // Update media element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Skip to next track (auto-skip non-playable)
  const playNext = useCallback(() => {
    if (playlist.length === 0) return;

    let nextIndex = currentIndex + 1;
    
    // Loop back to start if at end
    if (nextIndex >= playlist.length) {
      nextIndex = 0;
    }

    // Find next playable track
    let attempts = 0;
    while (attempts < playlist.length) {
      const nextTrack = playlist[nextIndex];
      
      if (isPlayableNFT(nextTrack)) {
        setCurrentIndex(nextIndex);
        setCurrentTrack(nextTrack);

        loadAndPlayTrack(nextTrack);
        return;
      }

      nextIndex = (nextIndex + 1) % playlist.length;
      attempts++;
    }

    // No playable tracks found
    console.warn("No playable tracks found in playlist");
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
    
    // Loop to end if at start
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }

    // Find previous playable track
    let attempts = 0;
    while (attempts < playlist.length) {
      const prevTrack = playlist[prevIndex];
      
      if (isPlayableNFT(prevTrack)) {
        setCurrentIndex(prevIndex);
        setCurrentTrack(prevTrack);

        loadAndPlayTrack(prevTrack);
        return;
      }

      prevIndex = prevIndex - 1 < 0 ? playlist.length - 1 : prevIndex - 1;
      attempts++;
    }

    console.warn("No playable tracks found in playlist");
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
      playNext();
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
  }, [currentMediaType, playNext, getActiveMediaElement]);

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


  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const activeElement = getActiveMediaElement();
    if (!activeElement || !currentTrack) return;

    if (isPlaying) {
      activeElement.pause();
    } else {
      activeElement.play().catch(err => {
        console.error("Error toggling play:", err);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, currentTrack, getActiveMediaElement]);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  }, []);

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
    setCurrentTime(0);
    setDuration(0);
    setCurrentMediaType("unknown");
  }, []);

  const value: AudioPlayerContextType = {
    currentTrack,
    playlist,
    currentIndex,
    isPlaying,
    volume,
    currentTime,
    duration,
    isLoading,
    isBuffering,
    currentMediaType,
    playTrack,
    playAll,
    playNext,
    playPrevious,
    togglePlay,
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
