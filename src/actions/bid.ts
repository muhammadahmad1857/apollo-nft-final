// "use server";

// import { db } from "@/lib/prisma";
// import type { BidModel as PrismaBid, BidCreateInput, UserModel } from "@/generated/prisma/models";
// import { updateHighestBid } from "./auction";

// /* --------------------
//    CREATE
// -------------------- */
// /**
//  * Record a bid and update auction's highest bid if needed
//  */
// export async function createBid(data: BidCreateInput): Promise<PrismaBid> {
//   // 1. Create bid record
//   const bid = await db.bid.create({ data });
//   if(!data.auction.connect?.id){
//     throw new Error("Auction ID must be provided to create a bid");
//   }
//   if(!data.bidder.connect?.id){
//     throw new Error("Bidder ID must be provided to create a bid");
//   }
//   // 2. Update highest bid in auction
//   await updateHighestBid(data.auction.connect.id, data.bidder.connect?.id, data.amount);

//   return bid;
// }

// /* --------------------
//    READ
// -------------------- */
// export async function getBidsByAuction(auctionId: number): Promise<PrismaBid[]> {
//   return db.bid.findMany({ where: { auctionId }, orderBy: { amount: "desc" } });
// }

// export async function getBidsByAuctionWithUser(
//   auctionId: number
// ): Promise<(PrismaBid & { bidder: UserModel })[]> {
//   return db.bid.findMany({ where: { auctionId }, orderBy: { amount: "desc" }, include: { bidder: true } });
// }

// export async function getBidsByUser(userId: number): Promise<PrismaBid[]> {
//   return db.bid.findMany({ where: { bidderId: userId }, orderBy: { createdAt: "desc" } });
// }

// /* --------------------
//    DELETE
// -------------------- */
// export async function deleteBid(id: number): Promise<PrismaBid> {
//   return db.bid.delete({ where: { id } });
// }


"use server";

import { db } from "@/lib/prisma";
import type { BidModel as PrismaBid, BidCreateInput, UserModel } from "@/generated/prisma/models";
import { updateHighestBid } from "./auction";
import {  pushToAbly } from "@/lib/ably";

/* --------------------
   Ably helper function
-------------------- */

async function pushBidEvent(bid: PrismaBid, action: string) {
  // 1️⃣ Insert into Outbox
  await db.outbox.create({
    data: {
      entity: "Bid",
      entityId: bid.id,
      action,
      payload: bid,
    },
  });

    await pushToAbly(`bid.${bid.id}`, "update", { action, bid });

}
/* --------------------
   CREATE
-------------------- */
/**
 * Record a bid and update auction's highest bid if needed
 */
export async function createBid(data: BidCreateInput): Promise<PrismaBid> {
 const bid = await db.bid.create({ data });

  if (!data.auction.connect?.id || !data.bidder.connect?.id) {
    throw new Error("Auction ID and Bidder ID required");
  }

  const updatedAuction = await updateHighestBid(
    data.auction.connect.id,
    data.bidder.connect.id,
    data.amount
  );

  // Push bid-specific event
  await pushBidEvent(bid, "created");
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
