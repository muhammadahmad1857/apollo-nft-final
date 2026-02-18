"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { isPlayableNFT } from "@/lib/media";

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
  
  // Methods
  playTrack: (nft: NFTWithRelations, playlist?: NFTWithRelations[]) => void;
  playAll: (playlist: NFTWithRelations[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  clearPlaylist: () => void;
  
  // Audio element ref
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentTrack, setCurrentTrack] = useState<NFTWithRelations | null>(null);
  const [playlist, setPlaylist] = useState<NFTWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Update audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
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
        
        if (audioRef.current) {
          audioRef.current.src = nextTrack.mediaUrl;
          audioRef.current.play().catch(err => {
            console.error("Error playing next track:", err);
            setIsPlaying(false);
          });
        }
        return;
      }

      nextIndex = (nextIndex + 1) % playlist.length;
      attempts++;
    }

    // No playable tracks found
    console.warn("No playable tracks found in playlist");
    setIsPlaying(false);
  }, [playlist, currentIndex]);

  // Skip to previous track
  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;

    // If more than 3 seconds into track, restart it
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
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
        
        if (audioRef.current) {
          audioRef.current.src = prevTrack.mediaUrl;
          audioRef.current.play().catch(err => {
            console.error("Error playing previous track:", err);
            setIsPlaying(false);
          });
        }
        return;
      }

      prevIndex = prevIndex - 1 < 0 ? playlist.length - 1 : prevIndex - 1;
      attempts++;
    }

    console.warn("No playable tracks found in playlist");
    setIsPlaying(false);
  }, [playlist, currentIndex, currentTime]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Auto-advance to next track
      playNext();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [playNext]);

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
    
    if (audioRef.current) {
      audioRef.current.src = nft.mediaUrl;
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      });
    }
  }, []);

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
    
    if (audioRef.current) {
      audioRef.current.src = firstTrack.mediaUrl;
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      });
    }
  }, []);


  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Error toggling play:", err);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, currentTrack]);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  }, []);

  // Seek to time
  const seek = useCallback((time: number) => {
    if (audioRef.current && !isNaN(duration)) {
      const clampedTime = Math.max(0, Math.min(time, duration));
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  }, [duration]);

  // Clear playlist and stop playback
  const clearPlaylist = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCurrentTrack(null);
    setPlaylist([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
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
    playTrack,
    playAll,
    playNext,
    playPrevious,
    togglePlay,
    setVolume,
    seek,
    clearPlaylist,
    audioRef,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
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
