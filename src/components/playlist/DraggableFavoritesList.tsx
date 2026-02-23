"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reorderFavorites } from "@/actions/nft-likes";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { isPlayableNFT } from "@/lib/media";

type LikedNFT = {
  id: number;
  nftId: number;
  position: number;
  nft: {
    id: number;
    title: string;
    name?: string;
    fileType: string;
    mediaUrl?: string;
    tokenId: number;
  };
};

export function DraggableFavoritesList({ likedNFTs, userId }: { likedNFTs: LikedNFT[]; userId: number }) {
  const [items, setItems] = useState<LikedNFT[]>(likedNFTs);
  const [saving, setSaving] = useState(false);
  const { playSingle, playQueue } = useAudioPlayer();

  const playableItems = useMemo(() => items.filter((item) => isPlayableNFT(item.nft)).map((item) => item.nft), [items]);

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const next = [...items];
    const [target] = next.splice(index, 1);
    next.splice(nextIndex, 0, target);
    setItems(next);
  };

  const persistOrder = async () => {
    setSaving(true);
    try {
      await reorderFavorites(
        userId,
        items.map((item, index) => ({ nftId: item.nftId, position: index }))
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => playableItems.length > 0 && playQueue(playableItems)}>
          <PlayCircle className="mr-2 h-4 w-4" />
          Play All
        </Button>
        <Button size="sm" onClick={persistOrder} disabled={saving}>
          {saving ? "Saving..." : "Save Order"}
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const playable = isPlayableNFT(item.nft);
          return (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => playable && playSingle(item.nft)}
                disabled={!playable}
              >
                <p className="truncate text-sm font-medium text-white">{item.nft.title}</p>
                <p className="text-xs text-zinc-400">#{item.nft.tokenId} · {item.nft.fileType || "unknown"}{!playable ? " · not playable" : ""}</p>
              </button>

              <div className="ml-3 flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => moveItem(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => moveItem(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
