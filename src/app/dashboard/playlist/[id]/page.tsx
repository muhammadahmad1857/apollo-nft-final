"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { PlaylistView } from "@/components/playlist/PlaylistView";
import { Button } from "@/components/ui/button";

type PlaylistItem = {
  id: number;
  position: number;
  nft: {
    id: number;
    title: string;
    tokenId: number;
    fileType: string;
    mediaUrl?: string;
  };
};

type Playlist = {
  id: number;
  name: string;
  items: PlaylistItem[];
};

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const { address } = useAccount();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mode, setMode] = useState<"audio" | "video" | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!address || !params?.id) return;
      const res = await fetch(`/api/playlists/${params.id}?walletAddress=${address}`);
      const json = await res.json();
      if (active) {
        setPlaylist(json?.playlist ?? null);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [address, params?.id]);

  const items = useMemo(() => (playlist?.items || []).map((item) => item.nft), [playlist?.items]);

  if (!playlist) {
    return <div className="p-4 text-sm text-zinc-400">Playlist not found.</div>;
  }

  return (
    <div className="space-y-6 p-4 pb-32">
      <div>
        <h1 className="text-3xl font-bold">{playlist.name}</h1>
        <p className="text-sm text-zinc-400">{playlist.items.length} items</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "all" ? "default" : "outline"} onClick={() => setMode("all")}>All</Button>
        <Button variant={mode === "audio" ? "default" : "outline"} onClick={() => setMode("audio")}>Audio</Button>
        <Button variant={mode === "video" ? "default" : "outline"} onClick={() => setMode("video")}>Video</Button>
        <Button variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")}>Grid</Button>
        <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>List</Button>
      </div>

      <PlaylistView items={items} mode={mode} view={view} />
    </div>
  );
}
