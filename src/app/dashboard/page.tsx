"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categories } from "@/data/dashboard";
import { getUserByWallet } from "@/actions/users";
import { getNFTsByOwner } from "@/actions/nft";
import { Avatar } from "@radix-ui/react-avatar";
import { Filter, CheckCircle, Music, Image, Video, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import {NFTCard} from "@/components/nft-card";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";

  const [user, setUser] = React.useState<any>(null);
  const [nfts, setNfts] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [filters, setFilters] = React.useState({ minted: false, music: false, photos: false, videos: false });
  const [filterDialogOpen, setFilterDialogOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      // TODO: Replace with actual wallet address from auth/session
      const walletAddress = typeof window !== "undefined" ? window.localStorage.getItem("walletAddress") || "" : "";
      if (!walletAddress) return;
      const userData = await getUserByWallet(walletAddress);
      setUser(userData);
      if (userData) {
        const nftsData = await getNFTsByOwner(userData.id);
        setNfts(nftsData);
      }
    }
    fetchData();
  }, []);

  const filteredNFTs = nfts.filter((nft) => {
    if (selectedCategory !== "All" && nft.category !== selectedCategory) return false;
    if (filters.minted && !nft.minted) return false;
    if (filters.music && nft.category !== "Music") return false;
    if (filters.photos && nft.category !== "Photos") return false;
    if (filters.videos && nft.category !== "Videos") return false;
    if (!nft.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!user) {
    return <div className="flex justify-center items-center min-h-[40vh] text-muted-foreground">Loading user...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-8">
      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-1/4 flex flex-col gap-6">
        {/* User Card */}
        <Card className="flex flex-col items-center p-6 gap-3">
          <AvatarImage src={user.avatarUrl || "/default-avatar.png"} alt={user.name} className="size-24 mb-2 rounded-full" />
          <AvatarFallback className="rounded-lg">{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          <div className="text-xl font-bold">{user.name}</div>
          <div className="text-muted-foreground">{user.walletAddress}</div>
          <div className="text-sm text-center text-muted-foreground">{user.email}</div>
          <Button size="sm" className="w-full mt-4">Edit Profile</Button>
        </Card>
        {/* Stats: show here on desktop only */}
        <div className="hidden lg:block">
          <Card className="p-4">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Stats</span>
              <span className="text-muted-foreground">$APOLLO</span>
            </div>
            <div className="text-2xl font-bold">
              {user.apollo} <span className="text-base">$APOLLO</span>
            </div>
            <div className="text-xs text-muted-foreground">{user.address}</div>
          </Card>
        </div>
        {/* Filters: only show on desktop */}
        <div className="hidden lg:block">
          <Card className="p-4">
            <div className="font-semibold flex items-center gap-2 mb-3">
              <Filter /> Filters
            </div>
            <div className="flex flex-col gap-2">
              {[
                { key: "minted", label: "Minted", icon: CheckCircle },
                { key: "music", label: "Music", icon: Music },
                { key: "photos", label: "Photos", icon: Image },
                { key: "videos", label: "Videos", icon: Video },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() =>
                    setFilters((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))
                  }
                  className={`flex items-center gap-3 px-3 py-2 rounded border transition font-medium text-sm
                    ${
                      filters[key as keyof typeof filters]
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                >
                  <span className="flex items-center justify-center w-5 h-5"><Icon /></span>
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 items-center relative">
          <div className="w-full md:w-1/2 flex items-center relative">
            <Input
              placeholder="Search NFT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-12"
            />
            {/* Mobile filter button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 block lg:hidden">
              <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline" className="rounded-full">
                    <Filter />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs w-full">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Filter /> Filters</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-2">
                    {[
                      { key: "minted", label: "Minted", icon: CheckCircle },
                      { key: "music", label: "Music", icon: Music },
                      { key: "photos", label: "Photos", icon: Image },
                      { key: "videos", label: "Videos", icon: Video },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() =>
                          setFilters((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))
                        }
                        className={`flex items-center gap-3 px-3 py-2 rounded border transition font-medium text-sm w-full
                          ${
                            filters[key as keyof typeof filters]
                              ? "bg-primary/10 border-primary text-primary"
                              : "border-border hover:bg-muted"
                          }`}
                      >
                        <span className="flex items-center justify-center w-5 h-5"><Icon /></span>
                        {label}
                      </button>
                    ))}
                  </div>
                  <DialogClose asChild>
                    <Button variant="secondary" className="w-full mt-4 flex items-center gap-2"><X /> Close</Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex gap-2 md:ml-auto flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        {/* NFT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNFTs.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground">
              No NFTs found.
            </div>
          ) : (
            filteredNFTs.map((nft, i) => (
              <NFTCard
                key={nft.id || i}
                nft={nft}
                owner={true}
                onEditRoyalty={() => alert(`Edit royalty for ${nft.title}`)}
                onBuy={() => alert(`Buy ${nft.title}`)}
                onShare={() => alert(`Share ${nft.title}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
