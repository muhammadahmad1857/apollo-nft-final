"use server";

import { db } from "@/lib/prisma";
import type { NFTLikeModel as PrismaNFTLike, NFTLikeCreateInput } from "@/generated/prisma/models";

/* --------------------
   CREATE
-------------------- */
export async function createNFTLike(data: NFTLikeCreateInput): Promise<PrismaNFTLike> {
  return db.nFTLike.create({ data });
}

/* --------------------
   READ
-------------------- */
export async function getNFTLikesByNFT(nftId: number): Promise<PrismaNFTLike[]> {
  return db.nFTLike.findMany({ where: { nftId }, orderBy: { createdAt: "desc" } });
}

export async function getNFTLikesByUser(userId: number): Promise<PrismaNFTLike[]> {
  return db.nFTLike.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

/* --------------------
   DELETE
-------------------- */
export async function deleteNFTLike(nftId: number, userId: number): Promise<PrismaNFTLike> {
  return db.nFTLike.delete({ where: { nftId_userId: { nftId, userId } } });
}
