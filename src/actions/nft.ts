"use server";

import { db } from "@/lib/prisma";
import type { NFTModel as PrismaNFT, NFTCreateInput, NFTUpdateInput } from "@/generated/prisma/models";

/* --------------------
   CREATE
-------------------- */
export async function createNFT(data: NFTCreateInput): Promise<PrismaNFT> {
  return db.nFT.create({ data });
}

/* --------------------
   READ
-------------------- */
export async function getNFTById(id: number): Promise<PrismaNFT | null> {
  return db.nFT.findUnique({ where: { id } });
}

export async function getNFTByTokenId(tokenId: number): Promise<PrismaNFT | null> {
  return db.nFT.findUnique({ where: { tokenId } });
}

export async function getNFTsByCreator(creatorId: number): Promise<PrismaNFT[]> {
  return db.nFT.findMany({ where: { creatorId }, orderBy: { createdAt: "desc" } });
}

export async function getNFTsByOwner(ownerId: number): Promise<PrismaNFT[]> {
  return db.nFT.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
}

/* --------------------
   UPDATE
-------------------- */
export async function updateNFT(id: number, data: NFTUpdateInput): Promise<PrismaNFT> {
  return db.nFT.update({ where: { id }, data });
}

/* --------------------
   DELETE
-------------------- */
export async function deleteNFT(id: number): Promise<PrismaNFT> {
  return db.nFT.delete({ where: { id } });
}
