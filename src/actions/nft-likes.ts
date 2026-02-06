// "use server";

// import { db } from "@/lib/prisma";
// import type { NFTLikeModel as PrismaNFTLike, NFTLikeCreateInput } from "@/generated/prisma/models";

// /* --------------------
//    CREATE
// -------------------- */
// export async function createNFTLike(data: NFTLikeCreateInput): Promise<PrismaNFTLike> {
//   return db.nFTLike.create({ data });
// }

// /* --------------------
//    READ
// -------------------- */
// export async function getNFTLikesByNFT(nftId: number): Promise<PrismaNFTLike[]> {
//   return db.nFTLike.findMany({ where: { nftId }, orderBy: { createdAt: "desc" } });
// }

// export async function getNFTLikesByUser(userId: number): Promise<PrismaNFTLike[]> {
//   return db.nFTLike.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
// }

// /* --------------------
//    DELETE
// -------------------- */
// export async function deleteNFTLike(nftId: number, userId: number): Promise<PrismaNFTLike> {
//   return db.nFTLike.delete({ where: { nftId_userId: { nftId, userId } } });
// }

// /* --------------------
//    CHECK IF USER LIKED
// -------------------- */
// export async function checkIfUserLikedNFT(nftId: number, userId: number): Promise<boolean> {
//   const like = await db.nFTLike.findUnique({
//     where: { nftId_userId: { nftId, userId } },
//   });
//   return !!like;
// }

// /* --------------------
//    TOGGLE LIKE
// -------------------- */
// export async function toggleNFTLike(nftId: number, userId: number): Promise<{ liked: boolean }> {
//   const alreadyLiked = await checkIfUserLikedNFT(nftId, userId);

//   if (alreadyLiked) {
//     await deleteNFTLike(nftId, userId);
//     return { liked: false };
//   } else {
//     await createNFTLike({ 
//       nft:{
//       connect: { tokenId: nftId },

//     }, 
//     user: 
//     { 
//       connect: { 
//         id: userId
//        } 
//       } 
//     });
//     return { liked: true };
//   }
// }


"use server";

import { db } from "@/lib/prisma";
import type { NFTLikeModel as PrismaNFTLike, NFTLikeCreateInput } from "@/generated/prisma/models";
import {  pushToAbly } from "@/lib/ably";

/* --------------------
   Ably helper function
-------------------- */

async function pushLikeEvent(like: PrismaNFTLike, action: string) {
  await db.outbox.create({
    data: { entity: "NFTLike", entityId: like.id, action, payload: like },
  });
  await pushToAbly(`nft.${like.nftId}`, "like", { action, like });
}


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
  const alreadyLiked = await checkIfUserLikedNFT(nftId, userId);

  let liked: boolean;

  if (alreadyLiked) {
    const like = await deleteNFTLike(nftId, userId);
    await pushLikeEvent(like, "unlike");
    liked = false;
  } else {
    const like = await createNFTLike({ nft: { connect: { tokenId: nftId } }, user: { connect: { id: userId } } });
    await pushLikeEvent(like, "like");
    liked = true;
  }

  return { liked };
}



