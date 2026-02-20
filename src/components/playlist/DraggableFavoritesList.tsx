"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlaylistNFTCard } from "./PlaylistNFTCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reorderFavorites } from "@/actions/nft-likes";
import { toast } from "sonner";

type NFTWithRelations = {
  id: number;
  tokenId: number;
  name: string;
  title: string;
  imageUrl: string;
  mediaUrl: string;
  description: string;
  fileType: string;
  mintPrice: number;
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

type LikedNFT = {
  id: number;
  nftId: number;
  userId: number;
  position: number;
  createdAt: Date;
  nft: NFTWithRelations;
};

interface DraggableFavoritesListProps {
  likedNFTs: LikedNFT[];
  userId: number;
}

// Sortable item wrapper
function SortablePlaylistItem({ 
  likedNFT, 
  index,
  totalItems 
}: { 
  likedNFT: LikedNFT; 
  index: number;
  totalItems: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: likedNFT.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PlaylistNFTCard
        likedNFT={likedNFT}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        index={index}
        totalItems={totalItems}
      />
    </div>
  );
}

export function DraggableFavoritesList({ likedNFTs, userId }: DraggableFavoritesListProps) {
  const [items, setItems] = useState(likedNFTs);
  const [activeId, setActiveId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation for reordering favorites
  const reorderMutation = useMutation({
    mutationFn: async (updates: { nftId: number; position: number }[]) => {
      return reorderFavorites(userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likedNFTs", userId] });
      toast.success("Playlist order updated");
    },
    onError: (error) => {
      console.error("Error reordering favorites:", error);
      toast.error("Failed to update playlist order");
      // Revert to original order on error
      setItems(likedNFTs);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setItems((currentItems) => {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id);
      const newIndex = currentItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(currentItems, oldIndex, newIndex);

      // Update positions in database
      const updates = newItems.map((item, index) => ({
        nftId: item.nftId,
        position: index,
      }));

      // Optimistic update
      reorderMutation.mutate(updates);

      return newItems;
    });
  };

  // Update items when likedNFTs prop changes
  if (items.length !== likedNFTs.length || items[0]?.id !== likedNFTs[0]?.id) {
    setItems(likedNFTs);
  }

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">💔</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No favorites yet
        </h3>
        <p className="text-white/60 max-w-md">
          Start building your playlist by liking NFTs from the marketplace!
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((likedNFT, index) => (
            <SortablePlaylistItem
              key={likedNFT.id}
              likedNFT={likedNFT}
              index={index}
              totalItems={items.length}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90 cursor-grabbing">
            <PlaylistNFTCard
              likedNFT={activeItem}
              isDragging={true}
              index={items.findIndex(item => item.id === activeId)}
              totalItems={items.length}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
