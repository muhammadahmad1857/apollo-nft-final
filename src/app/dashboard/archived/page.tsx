"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useUser } from "@/hooks/useUser";
import { getArchivedNFTsByOwner } from "@/actions/nft";
import { useQuery } from "@tanstack/react-query";
import { NFTCard } from "@/components/nft-card";
import Loader from "@/components/loader/index";
import { Archive, Search, Grid3x3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlockedUserNotice } from "@/components/blocked-user-notice";

type ViewMode = "grid" | "list";

export default function ArchivedPage() {
  const { address } = useAccount();
  const { data: user } = useUser(address || "");
  const isUserBlocked = !!user?.isBlocked;

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: archivedNFTs = [], isLoading, isError } = useQuery({
    queryKey: ["archivedNFTs", user?.id],
    queryFn: () => getArchivedNFTsByOwner(user!.id, true),
    enabled: !!user?.id,
  });

  const filteredNFTs = useMemo(() => {
    return archivedNFTs.filter((nft) =>
      nft.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [archivedNFTs, search]);

  if (isUserBlocked) {
    return (
      <BlockedUserNotice message="You cannot view archived NFTs because your account is blocked." />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Archive className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Archived NFTs</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 size={16} />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
        <Input
          placeholder="Search archived NFTs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <Loader text="Loading archived NFTs..." />
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load archived NFTs</p>
        </div>
      ) : filteredNFTs.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium mb-2">No archived NFTs yet</p>
          <p className="text-muted-foreground">
            Archive your NFTs to keep them safe and prevent accidental trading
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {filteredNFTs.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              owner={true}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredNFTs.length > 0 && (
        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
          Showing {filteredNFTs.length} of {archivedNFTs.length} archived NFT{archivedNFTs.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
