"use server";

import { db } from "@/lib/prisma";
import type { BidModel as PrismaBid, BidCreateInput } from "@/generated/prisma/models";

/* --------------------
   CREATE
-------------------- */
export async function createBid(data: BidCreateInput): Promise<PrismaBid> {
  return db.bid.create({ data });
}

/* --------------------
   READ
-------------------- */
export async function getBidsByAuction(auctionId: number): Promise<PrismaBid[]> {
  return db.bid.findMany({ where: { auctionId }, orderBy: { amount: "desc" } });
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
