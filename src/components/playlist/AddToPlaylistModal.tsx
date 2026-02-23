"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddToPlaylistModalProps {
  nftId: number;
  walletAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Playlist {
  id: number;
  name: string;
  _count?: { items: number };
}

export function AddToPlaylistModal({
  nftId,
  walletAddress,
  open,
  onOpenChange,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addedPlaylists, setAddedPlaylists] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<Set<number>>(new Set());
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [fetchingPlaylists, setFetchingPlaylists] = useState(false);

  useEffect(() => {
    if (open && walletAddress) {
      fetchPlaylists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, walletAddress, nftId]);

  const fetchPlaylists = async () => {
    setFetchingPlaylists(true);
    try {
      const response = await fetch(`/api/playlists?walletAddress=${walletAddress}`);
      const json = await response.json();
      const data = Array.isArray(json?.playlists) ? json.playlists : [];
      setPlaylists(data);

      // Check which playlists already contain this NFT
      const added = new Set<number>();
      await Promise.all(
        data.map(async (playlist: Playlist) => {
          try {
            const itemsResponse = await fetch(
              `/api/playlists/${playlist.id}/items?walletAddress=${walletAddress}`
            );
            const itemsJson = await itemsResponse.json();
            const items = Array.isArray(itemsJson?.items) ? itemsJson.items : [];
            if (items.some((item: { nftId: number }) => item.nftId === nftId)) {
              added.add(playlist.id);
            }
          } catch (error) {
            console.error(`Failed to check playlist ${playlist.id}`, error);
          }
        })
      );
      setAddedPlaylists(added);
    } catch (error) {
      console.error("Failed to fetch playlists", error);
      toast.error("Failed to load playlists");
    } finally {
      setFetchingPlaylists(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Enter playlist name");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, name: newPlaylistName.trim() }),
      });

      const json = await response.json();
      if (!response.ok) {
        toast.error(json?.error || "Failed to create playlist");
        return;
      }

      const created = json?.playlist;
      if (created?.id && created?.name) {
        setPlaylists((prev) => [created, ...prev]);
        setNewPlaylistName("");
        toast.success("Playlist created");
        
        // Automatically add to the new playlist
        await handleTogglePlaylist(created.id, false);
      }
    } catch (error) {
      console.error("Failed to create playlist", error);
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePlaylist = async (playlistId: number, isAdded: boolean) => {
    setLoading((prev) => new Set([...prev, playlistId]));

    try {
      if (isAdded) {
        // Remove from playlist
        const response = await fetch(
          `/api/playlists/${playlistId}/items?walletAddress=${walletAddress}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nftId }),
          }
        );

        const json = await response.json();
        if (!response.ok) {
          toast.error(json?.error || "Failed to remove from playlist");
          return;
        }

        setAddedPlaylists((prev) => {
          const updated = new Set(prev);
          updated.delete(playlistId);
          return updated;
        });
        toast.success("Removed from playlist");
      } else {
        // Add to playlist
        const response = await fetch(
          `/api/playlists/${playlistId}/items?walletAddress=${walletAddress}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nftId }),
          }
        );

        const json = await response.json();
        if (!response.ok) {
          toast.error(json?.error || "Failed to add to playlist");
          return;
        }

        setAddedPlaylists((prev) => new Set([...prev, playlistId]));
        toast.success("Added to playlist");
      }
    } catch (error) {
      console.error("Failed to update playlist", error);
      toast.error("Failed to update playlist");
    } finally {
      setLoading((prev) => {
        const updated = new Set(prev);
        updated.delete(playlistId);
        return updated;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5" />
            Add to Playlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Playlist */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">Create New Playlist</p>
            <div className="flex gap-2">
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                className="flex-1"
              />
              <Button
                onClick={handleCreatePlaylist}
                disabled={isCreating || !newPlaylistName.trim()}
                size="sm"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Existing Playlists */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Your Playlists {playlists.length > 0 && `(${playlists.length})`}
            </p>

            {fetchingPlaylists ? (
              <div className="flex items-center justify-center py-8 text-sm text-zinc-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading playlists...
              </div>
            ) : playlists.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-700 p-8 text-center">
                <ListPlus className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                <p className="text-sm text-zinc-400">No playlists yet</p>
                <p className="text-xs text-zinc-500">Create one above to get started</p>
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                {playlists.map((playlist) => {
                  const isAdded = addedPlaylists.has(playlist.id);
                  const isLoading = loading.has(playlist.id);

                  return (
                    <button
                      key={playlist.id}
                      onClick={() => handleTogglePlaylist(playlist.id, isAdded)}
                      disabled={isLoading}
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left transition-colors hover:bg-zinc-800/50 disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {playlist.name}
                        </p>
                        {playlist._count?.items !== undefined && (
                          <p className="text-xs text-zinc-500">
                            {playlist._count.items} track{playlist._count.items !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <div className="ml-3 shrink-0">
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                        ) : isAdded ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/20">
                            <Check className="h-4 w-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-zinc-600"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
