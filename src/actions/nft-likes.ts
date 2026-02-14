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

    let liked = false;

    try {
      await tx.nFTLike.create({
        data: { nftId, userId }
      });
      liked = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.code === "P2002") {
        await tx.nFTLike.delete({
          where: {
            nftId_userId: {
              nftId,
              userId
            }
          }
        });
        liked = false;
      } else {
        throw err;
      }
    }

    const count = await tx.nFTLike.count({
      where: { nftId }
    });

    return { liked, count };
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
    orderBy: { createdAt: "desc" }
  });
}
