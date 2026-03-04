"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  subscribeMarketplaceStream,
  type MarketplaceStreamEvent,
} from "@/lib/marketplaceApi";
import { marketplaceQueryKeys } from "@/lib/marketplaceQueryKeys";

function invalidateForEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  evt: MarketplaceStreamEvent,
) {
  const eventType = evt.type;

  if (eventType.startsWith("marketplace.nft.")) {
    void queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.nfts });
    if (typeof evt.data?.nftId === "number") {
      void queryClient.invalidateQueries({
        queryKey: marketplaceQueryKeys.nft(evt.data.nftId),
      });
      void queryClient.invalidateQueries({
        queryKey: marketplaceQueryKeys.auction(evt.data.nftId),
      });
    }
  }

  if (eventType.startsWith("marketplace.auction.")) {
    void queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.auctions });
    if (typeof evt.data?.nftId === "number") {
      void queryClient.invalidateQueries({
        queryKey: marketplaceQueryKeys.auction(evt.data.nftId),
      });
    }
  }

  if (eventType.startsWith("marketplace.bid.")) {
    void queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.auctions });
  }

  if (eventType.startsWith("marketplace.like.")) {
    void queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.nfts });
    void queryClient.invalidateQueries({ queryKey: ["likedNFTs"] });
  }

  if (eventType.startsWith("marketplace.user.")) {
    void queryClient.invalidateQueries({ queryKey: ["user"] });
  }

  if (eventType.startsWith("marketplace.file.")) {
    void queryClient.invalidateQueries({ queryKey: ["files"] });
  }
}

export function MarketplaceStreamBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeMarketplaceStream((evt) => {
      invalidateForEvent(queryClient, evt);
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return null;
}
