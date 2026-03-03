"use server";

import { db } from "@/lib/prisma";
import { NftModerationStatus } from "@/generated/prisma/enums";
import type { BidModel as PrismaBid, BidCreateInput, UserModel } from "@/generated/prisma/models";
import { updateHighestBid } from "./auction";

const SUPPORT_EMAIL = "hello@blaqclouds.io";

/* --------------------
   CREATE
-------------------- */
/**
 * Record a bid and update auction's highest bid if needed
 */
export async function createBid(data: BidCreateInput): Promise<PrismaBid> {
  const bidderId = data.bidder.connect?.id;
  const auctionId = data.auction.connect?.id;

  if (!auctionId) {
    throw new Error("Auction ID must be provided to create a bid");
  }
  if (!bidderId) {
    throw new Error("Bidder ID must be provided to create a bid");
  }

  const bidder = await db.user.findUnique({
    where: { id: bidderId },
    select: { isBlocked: true },
  });

  if (bidder?.isBlocked) {
    throw new Error(
      `Your account is blocked. Contact us at ${SUPPORT_EMAIL} if this is a mistake.`,
    );
  }

  const auction = await db.auction.findUnique({
    where: { id: auctionId },
    include: { nft: { select: { moderationStatus: true } } },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  if (
    auction.nft.moderationStatus === NftModerationStatus.DELISTED ||
    auction.nft.moderationStatus === NftModerationStatus.HIDDEN
  ) {
    throw new Error("This NFT is moderated and cannot accept bids.");
  }

  // 1. Create bid record
  const bid = await db.bid.create({ data });
  // 2. Update highest bid in auction
  await updateHighestBid(auctionId, bidderId, data.amount);

  return bid;
}

/* --------------------
   READ
-------------------- */
export async function getBidsByAuction(auctionId: number): Promise<PrismaBid[]> {
  return db.bid.findMany({ where: { auctionId }, orderBy: { amount: "desc" } });
}

export async function getBidsByAuctionWithUser(
  auctionId: number
): Promise<(PrismaBid & { bidder: UserModel })[]> {
  return db.bid.findMany({ where: { auctionId }, orderBy: { amount: "desc" }, include: { bidder: true } });
}

export async function getBidsByUser(userId: number): Promise<PrismaBid[]> {
  return db.bid.findMany({ where: { bidderId: userId }, orderBy: { createdAt: "desc" } });
}

/* --------------------
   DELETE
-------------------- */
export async function deleteBid(id: number): Promise<PrismaBid> {
  return db.bid.delete({ where: { id } });
}
