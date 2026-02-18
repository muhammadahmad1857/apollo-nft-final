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

/* --------------------
   CHECK IF USER LIKED
-------------------- */
export async function checkIfUserLikedNFT(nftId: number, userId: number): Promise<boolean> {
  const like = await db.nFTLike.findUnique({
    where: { nftId_userId: { nftId, userId } },
  });
  return !!like;
}

/* --------------------
   TOGGLE LIKE
-------------------- */
export async function toggleNFTLike(nftId: number, userId: number) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.nFTLike.findUnique({
      where: { nftId_userId: { nftId, userId } }
    });

    if (existing) {
      await tx.nFTLike.delete({ where: { nftId_userId: { nftId, userId } } });
      const count = await tx.nFTLike.count({ where: { nftId } });
      return { liked: false, count };
    } else {
      // Get the highest position and add 1
      const maxPosition = await tx.nFTLike.findFirst({
        where: { userId },
        orderBy: { position: "desc" },
        select: { position: true }
      });
      const newPosition = (maxPosition?.position ?? -1) + 1;
      
      await tx.nFTLike.create({ 
        data: { 
          nftId, 
          userId, 
          position: newPosition 
        } 
      });
      const count = await tx.nFTLike.count({ where: { nftId } });
      return { liked: true, count };
    }
  });
}


/* --------------------
   GET LIKED NFTs WITH FULL DETAILS
-------------------- */
export async function getLikedNFTsWithDetails(userId: number) {
  return db.nFTLike.findMany({
    where: { userId },
    include: {
      nft: {
        include: {
          owner: true,
          auction: true,
          likes: true,
          creator: true,
        }
      }
    },
    orderBy: { position: "asc" }
  });
}

/* --------------------
   REORDER FAVORITES (PLAYLIST)
-------------------- */
export async function reorderFavorites(
  userId: number, 
  updates: { nftId: number; position: number }[]
) {
  return await db.$transaction(async (tx) => {
    // Update each NFTLike position
    for (const update of updates) {
      await tx.nFTLike.update({
        where: {
          nftId_userId: {
            nftId: update.nftId,
            userId: userId
          }
        },
        data: { position: update.position }
      });
    }
    
    return { success: true };
  });
}

/* --------------------
   INITIALIZE FAVORITES ORDER (FOR EXISTING USERS)
-------------------- */
export async function initializeFavoritesOrder(userId: number) {
  const likes = await db.nFTLike.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });
  
  return await db.$transaction(async (tx) => {
    for (let i = 0; i < likes.length; i++) {
      await tx.nFTLike.update({
        where: {
          nftId_userId: {
            nftId: likes[i].nftId,
            userId: userId
          }
        },
        data: { position: i }
      });
    }
    return { success: true, count: likes.length };
  });
}
