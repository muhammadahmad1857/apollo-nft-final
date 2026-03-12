"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscribeMarketplaceStream } from "@/lib/marketplaceApi";

interface ArtistRealtimeRefreshProps {
  walletAddress: string;
}

export function ArtistRealtimeRefresh({ walletAddress }: ArtistRealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    const normalizedWallet = walletAddress.trim().toLowerCase();

    const unsubscribe = subscribeMarketplaceStream((evt) => {
      if (
        evt.type.startsWith("marketplace.nft.") ||
        evt.type.startsWith("marketplace.auction.") ||
        evt.type.startsWith("marketplace.bid.") ||
        evt.type.startsWith("marketplace.like.") ||
        evt.type.startsWith("marketplace.user.")
      ) {
        const wallets = Array.isArray(evt.data?.wallets)
          ? (evt.data.wallets as unknown[])
              .filter((value): value is string => typeof value === "string")
              .map((value) => value.toLowerCase())
          : [];

        if (wallets.length === 0 || wallets.includes(normalizedWallet)) {
          router.refresh();
        }
      }
    }, {
      wallet: normalizedWallet,
    });

    return () => {
      unsubscribe();
    };
  }, [router, walletAddress]);

  return null;
}
