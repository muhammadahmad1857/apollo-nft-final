"use server";

import { db } from "@/lib/prisma";
import type {
  AuctionModel as PrismaAuction,
  AuctionCreateInput,
  AuctionUpdateInput,
  BidModel,
  NFTModel,
  UserModel,
} from "@/generated/prisma/models";

/* --------------------
   CREATE
-------------------- */
export async function createAuction(data: AuctionCreateInput): Promise<PrismaAuction> {
  return db.auction.create({ data });
}

/* --------------------
   READ
-------------------- */
export async function getAuctionById(id: number): Promise<PrismaAuction | null> {
  return db.auction.findUnique({ where: { id } });
}

export async function getAuctionByNFT(
  nftId: number
): Promise<
  (PrismaAuction & {
    seller: UserModel;
    nft: NFTModel;
    highestBidder: UserModel | null;
    bids: BidModel[];
  }) | null
> {
  return db.auction.findUnique({
    where: { nftId },
    include: { nft: true, seller: true, highestBidder: true, bids: true },
  });
}

export async function getAuctionsBySeller(sellerId: number): Promise<PrismaAuction[]> {
  return db.auction.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" } });
}

/**
 * Get active auctions (not settled and currently ongoing)
 * Optional filters: minPrice, maxPrice, sellerId
 */
export async function getActiveAuctions(filters?: {
  minPrice?: number;
  maxPrice?: number;
  sellerId?: number;
}): Promise<
  (PrismaAuction & { seller: UserModel; nft: NFTModel; highestBidder: UserModel | null; bids: BidModel[] })[]
> {
  const now = new Date();
  return db.auction.findMany({
    where: {
      startTime: { lte: now },
      endTime: { gte: now },
      settled: false,
      minBid: filters?.minPrice ? { gte: filters.minPrice } : undefined,
      highestBid: filters?.maxPrice ? { lte: filters.maxPrice } : undefined,
      sellerId: filters?.sellerId,
    },
    include: { nft: true, seller: true, highestBidder: true, bids: true },
    orderBy: { endTime: "asc" },
  });
}

/* --------------------
   UPDATE
-------------------- */
export async function updateAuction(id: number, data: AuctionUpdateInput): Promise<PrismaAuction> {
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
  const auction = await db.auction.findUnique({ where: { id: auctionId } });
  if (!auction) throw new Error("Auction not found");

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
  return db.auction.update({ where: { id: auctionId }, data: { settled: true } });
}

/* --------------------
   DELETE
-------------------- */
export async function deleteAuction(id: number): Promise<PrismaAuction> {
  return db.auction.delete({ where: { id } });
}
