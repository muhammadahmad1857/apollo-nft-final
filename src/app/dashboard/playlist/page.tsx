"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Music4, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PlaylistSummary = {
  id: number;
  name: string;
  createdAt: string;
  _count?: { items: number };
};

export default function PlaylistIndexPage() {
  const { address } = useAccount();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [favRes, listRes] = await Promise.all([
        fetch(`/api/favorites?walletAddress=${address}`),
        fetch(`/api/playlists?walletAddress=${address}`),
      ]);

      const favJson = await favRes.json();
      const listJson = await listRes.json();

      setFavoritesCount(Array.isArray(favJson?.favorites) ? favJson.favorites.length : 0);
      setPlaylists(Array.isArray(listJson?.playlists) ? listJson.playlists : []);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const createPlaylist = async () => {
    if (!address || !name.trim()) return;
    await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address, name: name.trim() }),
    });
    setName("");
    await loadData();
  };

  return (
    <div className="space-y-6 p-4 pb-32">
      <div>
        <h1 className="text-3xl font-bold">Playlists</h1>
        <p className="text-sm text-zinc-400">Favorites + custom playlists</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-semibold">Create Playlist</h2>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My playlist" />
          <Button onClick={createPlaylist}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <Link href="/dashboard/favorites" className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music4 className="h-4 w-4" />
            <span className="font-semibold">Favorites</span>
          </div>
          <span className="text-sm text-zinc-400">{favoritesCount} items</span>
        </div>
      </Link>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Custom Playlists</h2>
        {loading ? (
          <p className="text-sm text-zinc-400">Loading playlists...</p>
        ) : playlists.length === 0 ? (
          <p className="text-sm text-zinc-400">No custom playlists yet.</p>
        ) : (
          playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/dashboard/playlist/${playlist.id}`}
              className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{playlist.name}</span>
                <span className="text-sm text-zinc-400">{playlist._count?.items ?? 0} items</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
