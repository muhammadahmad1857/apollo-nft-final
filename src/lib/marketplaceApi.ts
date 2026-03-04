import type {
  AuctionCreateInput,
  AuctionModel,
  AuctionUpdateInput,
  BidCreateInput,
  BidModel,
  FileCreateInput,
  FileModel,
  FileUpdateInput,
  NFTCreateInput,
  NFTLikeModel,
  NFTModel,
  NFTUpdateInput,
  UserCreateInput,
  UserModel,
  UserUpdateInput,
} from "@/generated/prisma/models";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apollonft.io"
).replace(/\/$/, "");

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code?: string;
  data: T;
}

export interface MarketplaceStreamEvent {
  eventId: string;
  timestamp: number;
  type: string;
  data: Record<string, unknown>;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("Invalid JSON response from marketplace API");
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Marketplace API request failed");
  }

  return payload;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await parseResponse<T>(response);
  return payload.data;
}

export function getMarketplaceStreamUrl(filters?: {
  wallet?: string;
  nftId?: number;
  auctionId?: number;
}) {
  return buildUrl("/marketplace/stream", {
    wallet: filters?.wallet?.trim().toLowerCase(),
    nftId: filters?.nftId,
    auctionId: filters?.auctionId,
  });
}

export function subscribeMarketplaceStream(
  onEvent: (event: MarketplaceStreamEvent) => void,
  options?: {
    wallet?: string;
    nftId?: number;
    auctionId?: number;
    onError?: () => void;
    onConnected?: () => void;
  },
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const eventSource = new EventSource(
    getMarketplaceStreamUrl({
      wallet: options?.wallet,
      nftId: options?.nftId,
      auctionId: options?.auctionId,
    }),
  );

  const handleConnected = () => {
    options?.onConnected?.();
  };

  const handleMarketplace = (evt: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(evt.data) as MarketplaceStreamEvent;
      onEvent(payload);
    } catch {
      // noop
    }
  };

  eventSource.addEventListener("connected", handleConnected);
  eventSource.addEventListener("marketplace", handleMarketplace as EventListener);
  eventSource.onerror = () => {
    options?.onError?.();
  };

  return () => {
    eventSource.removeEventListener("connected", handleConnected);
    eventSource.removeEventListener(
      "marketplace",
      handleMarketplace as EventListener,
    );
    eventSource.close();
  };
}

export const marketplaceApi = {
  nfts: {
    create: (data: NFTCreateInput) =>
      request<NFTModel>("/marketplace/nfts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getById: (id: number) => request<NFTModel | null>(`/marketplace/nfts/${id}`),
    getAll: (likes = false) =>
      request<(NFTModel & { owner: UserModel | null; auction: AuctionModel | null; likes?: NFTLikeModel[] })[]>(
        "/marketplace/nfts",
        undefined,
        { likes },
      ),
    getByTokenId: (tokenId: number) =>
      request<(NFTModel & { owner: UserModel | null }) | null>(
        `/marketplace/nfts/token/${tokenId}`,
      ),
    getVisibleByTokenId: (tokenId: number) =>
      request<(NFTModel & { owner: UserModel | null }) | null>(
        `/marketplace/nfts/token/${tokenId}/visible`,
      ),
    getByCreator: (creatorId: number) =>
      request<NFTModel[]>(`/marketplace/users/${creatorId}/nfts-created`),
    getByOwner: (
      ownerId: number,
      needLike = false,
      needAuction = false,
      needOwner = false,
    ) =>
      request<(NFTModel & { likes?: NFTLikeModel[]; auction?: AuctionModel | null; owner?: UserModel })[]>(
        `/marketplace/users/${ownerId}/nfts-owned`,
        undefined,
        { needLike, needAuction, needOwner },
      ),
    update: (id: number, data: NFTUpdateInput) =>
      request<NFTModel>(`/marketplace/nfts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    transferOwnership: (tokenId: number, newOwnerId: number) =>
      request<NFTModel>(`/marketplace/nfts/token/${tokenId}/transfer`, {
        method: "POST",
        body: JSON.stringify({ newOwnerId }),
      }),
    remove: (id: number) =>
      request<NFTModel>(`/marketplace/nfts/${id}`, {
        method: "DELETE",
      }),
    approveAuction: (id: number) =>
      request<NFTModel>(`/marketplace/nfts/${id}/approve-auction`, {
        method: "POST",
      }),
    approveMarket: (id: number) =>
      request<NFTModel>(`/marketplace/nfts/${id}/approve-market`, {
        method: "POST",
      }),
  },
  auctions: {
    create: (data: AuctionCreateInput) =>
      request<AuctionModel>("/marketplace/auctions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getById: (id: number) => request<AuctionModel | null>(`/marketplace/auctions/${id}`),
    getByNft: (nftId: number) =>
      request<
        | (AuctionModel & {
            seller: UserModel;
            nft: NFTModel;
            highestBidder: UserModel | null;
            bids: BidModel[];
          })
        | null
      >(`/marketplace/nfts/${nftId}/auction`),
    getBySeller: (sellerId: number) =>
      request<AuctionModel[]>(`/marketplace/users/${sellerId}/auctions`),
    getActive: (filters: {
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      endingSoon?: boolean;
    }) =>
      request<
        (AuctionModel & {
          seller: UserModel;
          nft: NFTModel;
          highestBidder: UserModel | null;
        })[]
      >("/marketplace/auctions/active", undefined, filters),
    update: (id: number, data: AuctionUpdateInput) =>
      request<AuctionModel>(`/marketplace/auctions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    updateHighestBid: (id: number, bidderId: number, bidAmount: number) =>
      request<AuctionModel>(`/marketplace/auctions/${id}/highest-bid`, {
        method: "PATCH",
        body: JSON.stringify({ bidderId, bidAmount }),
      }),
    settle: (id: number) =>
      request<AuctionModel>(`/marketplace/auctions/${id}/settle`, {
        method: "POST",
      }),
    remove: (id: number) =>
      request<AuctionModel>(`/marketplace/auctions/${id}`, {
        method: "DELETE",
      }),
    getByWallet: (wallet: string) =>
      request<(AuctionModel & { nft: NFTModel; highestBidder: UserModel | null; seller: UserModel; bids: BidModel[] })[]>(
        `/marketplace/users/wallet/${wallet}/auctions`,
      ),
    getHistoryByWallet: (wallet: string) =>
      request<unknown[]>(`/marketplace/users/wallet/${wallet}/auction-history`),
  },
  bids: {
    create: (auctionId: number, data: Omit<BidCreateInput, "auction">) =>
      request<BidModel>(`/marketplace/auctions/${auctionId}/bids`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getByAuction: (auctionId: number, includeBidder = false) =>
      request<(BidModel & { bidder?: UserModel })[]>(
        `/marketplace/auctions/${auctionId}/bids`,
        undefined,
        includeBidder ? { includeBidder: true } : undefined,
      ),
    getByUser: (userId: number) =>
      request<BidModel[]>(`/marketplace/users/${userId}/bids`),
    remove: (id: number) =>
      request<BidModel>(`/marketplace/bids/${id}`, {
        method: "DELETE",
      }),
  },
  likes: {
    create: (nftId: number, data: { userId: number } | NFTLikeModel) =>
      request<NFTLikeModel>(`/marketplace/nfts/${nftId}/likes`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getByNft: (nftId: number) =>
      request<NFTLikeModel[]>(`/marketplace/nfts/${nftId}/likes`),
    getByUser: (userId: number) =>
      request<NFTLikeModel[]>(`/marketplace/users/${userId}/likes`),
    remove: (nftId: number, userId: number) =>
      request<NFTLikeModel>(`/marketplace/nfts/${nftId}/likes/${userId}`, {
        method: "DELETE",
      }),
    check: (nftId: number, userId: number) =>
      request<boolean>(`/marketplace/nfts/${nftId}/likes/${userId}`),
    toggle: (nftId: number, userId: number) =>
      request<{ liked: boolean; count: number }>(
        `/marketplace/nfts/${nftId}/likes/toggle`,
        {
          method: "POST",
          body: JSON.stringify({ userId }),
        },
      ),
    getLikedNfts: (userId: number) =>
      request<
        (NFTLikeModel & {
          nft: NFTModel & {
            owner: UserModel;
            auction: AuctionModel | null;
            likes: NFTLikeModel[];
            creator: UserModel;
          };
        })[]
      >(`/marketplace/users/${userId}/liked-nfts`),
    reorderFavorites: (userId: number, updates: { nftId: number; position: number }[]) =>
      request<{ success: boolean }>(`/marketplace/users/${userId}/favorites/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ updates }),
      }),
    initializeFavorites: (userId: number) =>
      request<{ success: boolean; count?: number }>(
        `/marketplace/users/${userId}/favorites/init`,
        { method: "POST" },
      ),
  },
  files: {
    create: (data: FileCreateInput) =>
      request<FileModel>("/marketplace/files", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getByWallet: (walletId: string, minted?: boolean) =>
      request<FileModel[]>("/marketplace/files", undefined, {
        walletId,
        minted,
      }),
    getById: (id: string) => request<FileModel | null>(`/marketplace/files/${id}`),
    getTypeByIpfs: (ipfs: string) =>
      request<{ type: string; name: string }>("/marketplace/files/by-ipfs", undefined, {
        ipfs,
      }),
    update: (id: string, data: FileUpdateInput) =>
      request<FileModel>(`/marketplace/files/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    updateByWallet: (walletId: string, data: FileUpdateInput) =>
      request<{ count: number }>(`/marketplace/files/by-wallet/${walletId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<FileModel>(`/marketplace/files/${id}`, {
        method: "DELETE",
      }),
    removeByWallet: (walletId: string) =>
      request<{ count: number }>(`/marketplace/files/by-wallet/${walletId}`, {
        method: "DELETE",
      }),
  },
  users: {
    create: (data: UserCreateInput) =>
      request<UserModel>("/marketplace/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getById: (id: number) => request<UserModel | null>(`/marketplace/users/${id}`),
    getByWallet: (walletAddress: string) =>
      request<UserModel | null>(`/marketplace/users/by-wallet/${walletAddress}`),
    getAll: (take?: number, skip?: number) =>
      request<UserModel[]>("/marketplace/users", undefined, { take, skip }),
    updateById: (id: number, data: UserUpdateInput) =>
      request<UserModel>(`/marketplace/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    updateByWallet: (walletAddress: string, data: UserUpdateInput) =>
      request<UserModel>(`/marketplace/users/by-wallet/${walletAddress}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    upsertByWallet: (
      walletAddress: string,
      data: UserCreateInput & UserUpdateInput,
    ) =>
      request<UserModel>(`/marketplace/users/by-wallet/${walletAddress}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    removeById: (id: number) =>
      request<UserModel>(`/marketplace/users/${id}`, {
        method: "DELETE",
      }),
    removeByWallet: (walletAddress: string) =>
      request<UserModel>(`/marketplace/users/by-wallet/${walletAddress}`, {
        method: "DELETE",
      }),
    getTrendingSellers: (limit = 2) =>
      request<
        Array<{
          id: number;
          name: string;
          walletAddress: string;
          image: string | null;
          totalLikes: number;
          nftCount: number;
          createdAt: string;
        }>
      >("/marketplace/users/trending-sellers", undefined, { limit }),
    search: (q: string) =>
      request<
        Array<{
          id: number;
          walletAddress: string;
          name: string;
          avatarUrl: string | null;
        }>
      >("/marketplace/users/search", undefined, { q }),
    getArtistProfile: (walletAddress: string) =>
      request<{
        user: UserModel;
        stats: {
          totalNFTs: number;
          activeListings: number;
          activeAuctions: number;
        };
        nfts: (NFTModel & {
          auction: AuctionModel | null;
          likes: NFTLikeModel[];
          owner: Pick<UserModel, "walletAddress" | "name" | "avatarUrl">;
          creator: Pick<UserModel, "walletAddress" | "name" | "avatarUrl">;
        })[];
      }>(`/marketplace/artists/${walletAddress}/profile`),
  },
};
