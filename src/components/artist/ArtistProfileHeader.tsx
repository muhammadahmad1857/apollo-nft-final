"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";
import { truncateAddress } from "@/lib/truncate";

interface ArtistProfileHeaderProps {
  user: {
    walletAddress: string;
    name: string | null;
    avatarUrl: string | null;
  };
  stats: {
    totalNFTs: number;
    activeListings: number;
    activeAuctions: number;
  };
}

export function ArtistProfileHeader({ user, stats }: ArtistProfileHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24 md:h-32 md:w-32">
            <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name || "Artist"} />
            <AvatarFallback className="text-2xl">
              {user.name?.[0]?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.name || "Unnamed Artist"}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <p className="text-sm text-muted-foreground font-mono">
                  {truncateAddress(user.walletAddress)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              <div className="text-center md:text-left">
                <p className="text-2xl font-bold">{stats.totalNFTs}</p>
                <p className="text-sm text-muted-foreground">Total NFTs</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-2xl font-bold">{stats.activeListings}</p>
                <p className="text-sm text-muted-foreground">Active Listings</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-2xl font-bold">{stats.activeAuctions}</p>
                <p className="text-sm text-muted-foreground">Active Auctions</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ArtistProfileHeaderSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
