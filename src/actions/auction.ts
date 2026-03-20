"use server";

import { db } from "@/lib/prisma";
import { NftModerationStatus } from "@/generated/prisma/enums";
import type {
  AuctionModel as PrismaAuction,
  AuctionCreateInput,
  AuctionUpdateInput,
  BidModel,
  NFTModel,
  UserModel,
} from "@/generated/prisma/models";

const SUPPORT_EMAIL = "hello@blaqclouds.io";

function isTradeBlockedByModeration(status: NftModerationStatus): boolean {
  return (
    status === NftModerationStatus.DELISTED ||
    status === NftModerationStatus.HIDDEN
  );
}

async function ensureUserNotBlockedById(userId: number): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isBlocked: true },
  });

  if (user?.isBlocked) {
    throw new Error(
      `Your account is blocked. Contact us at ${SUPPORT_EMAIL} if this is a mistake.`,
    );
  }
}

/* --------------------
   CREATE
-------------------- */
export async function createAuction(
  data: AuctionCreateInput
): Promise<PrismaAuction> {
  const sellerId = data.seller.connect?.id;
  const nftId = data.nft.connect?.id;

  if (!sellerId) throw new Error("Seller ID is required");
  if (!nftId) throw new Error("NFT ID is required");

  await ensureUserNotBlockedById(sellerId);

  const nft = await db.nFT.findUnique({
    where: { id: nftId },
    select: { ownerId: true, moderationStatus: true, isArchived: true },
  });
  if (!nft) throw new Error("NFT not found");

  if (nft.ownerId !== sellerId) {
    throw new Error("Only owner can create auction for this NFT");
  }

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be auctioned.");
  }

  if (nft.isArchived) {
    throw new Error("Archived NFTs cannot be listed for auction.");
  }

  return db.auction.create({ data });
}

/* --------------------
   READ
-------------------- */
export async function getAuctionById(
  id: number
): Promise<PrismaAuction | null> {
  return db.auction.findUnique({ where: { id } });
}

export async function getAuctionByNFT(nftId: number): Promise<
  | (PrismaAuction & {
      seller: UserModel;
      nft: NFTModel;
      highestBidder: UserModel | null;
      bids: BidModel[];
    })
  | null
> {
  return db.auction.findFirst({
    where: {
      nftId,
      nft: {
        isArchived: false,
        moderationStatus: {
          not: NftModerationStatus.HIDDEN,
        },
      },
    },
    include: { nft: true, seller: true, highestBidder: true, bids: true },
  });
}

export async function getAuctionsBySeller(
  sellerId: number
): Promise<PrismaAuction[]> {
  return db.auction.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get active auctions (not settled and currently ongoing)
 * Optional filters: minPrice, maxPrice, sellerId
 */
export async function getActiveAuctions(filters: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  endingSoon?: boolean;
}) {
  const now = new Date();
  console.log("filters", filters);
  console.log("now", now);
  return db.auction.findMany({
    where: {
      settled: false,
      startTime: { lte: now },
      endTime: { gt: now },
      nft: {
        isArchived: false,
        moderationStatus: {
          in: [NftModerationStatus.ACTIVE, NftModerationStatus.FLAGGED],
        },
        title: filters.search
          ? { contains: filters.search, mode: "insensitive" }
          : undefined,
      },
      minBid: {
        gte: filters.minPrice ?? undefined,
        lte: filters.maxPrice ?? undefined,
      },
    },
    orderBy: filters.endingSoon
      ? { endTime: "asc" }
      : { createdAt: "desc" },
    include: {
      nft: true,
      seller: true,
      highestBidder: true,
    },
  });
}


/* --------------------
   UPDATE
-------------------- */
export async function updateAuction(
  id: number,
  data: AuctionUpdateInput
): Promise<PrismaAuction> {
  return db.auction.update({ where: { id }, data });
}

/**
 * Update highest bid safely
 */
export async function updateHighestBid(
  auctionId: number,
  bidderId: number,
  bidAmount: number
): Promise<PrismaAuction> {
  await ensureUserNotBlockedById(bidderId);

  const auction = await db.auction.findUnique({
    where: { id: auctionId },
    include: { nft: { select: { moderationStatus: true } } },
  });
  console.log("auction1",auction)
  if (!auction) throw new Error("Auction not found");
  if (isTradeBlockedByModeration(auction.nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot accept bids.");
  }
  console.log("auction",auction)
  if (!auction.highestBid || bidAmount > auction.highestBid) {
    return db.auction.update({
      where: { id: auctionId },
      data: { highestBid: bidAmount, highestBidderId: bidderId },
    });
  }

  return auction; // no change if bid not higher
}

/**
 * Settle auction in DB after contract call
 */
export async function settleAuction(auctionId: number): Promise<PrismaAuction> {
  const auction = await db.auction.findUnique({
    where: { id: auctionId },
    include: { nft: { select: { moderationStatus: true } }, seller: { select: { isBlocked: true } } },
  });
  if (!auction) throw new Error("Auction not found");
  if (auction.seller.isBlocked) {
    throw new Error(
      `Your account is blocked. Contact us at ${SUPPORT_EMAIL} if this is a mistake.`,
    );
  }
  if (isTradeBlockedByModeration(auction.nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be settled.");
  }

  return db.auction.update({
    where: { id: auctionId },
    data: { settled: true },
  });
}

/* --------------------
   DELETE
-------------------- */
export async function deleteAuction(id: number): Promise<PrismaAuction> {
  return db.auction.delete({ where: { id } });
}

export async function fetchUserAuctions(walletAddress: string) {
  if (!walletAddress) return [];

  const auctions = await db.auction.findMany({
    where: {
      OR: [
        { seller: { walletAddress } },
        { highestBidder: { walletAddress } }
      ],
    },
    include: {
      nft: true,
      highestBidder: true,
      seller: true,
      bids: { orderBy: { amount: "desc" } },
    },
    orderBy: { endTime: "desc" },
  });

  return auctions;
}


