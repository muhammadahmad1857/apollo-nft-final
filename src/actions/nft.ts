// "use server";

// import { db } from "@/lib/prisma";
// import type {
//   NFTModel as PrismaNFT,
//   NFTCreateInput,
//   NFTUpdateInput,
//   UserModel,
//   NFTLikeModel,
//   AuctionModel,
// } from "@/generated/prisma/models";

// /* --------------------
//    CREATE
// -------------------- */
// export async function createNFT(data: NFTCreateInput): Promise<PrismaNFT> {
//   return db.nFT.create({ data });
// }

// /* --------------------
//    READ
// -------------------- */
// export async function getNFTById(id: number): Promise<PrismaNFT | null> {
//   return db.nFT.findUnique({ where: { id } });
// }

// export async function getAllNFTs(): Promise<
//   (PrismaNFT & { owner: UserModel | null; auction: AuctionModel | null })[]
// > {
//   return db.nFT.findMany({
//     where: {
//       isListed: true,
//     },
//     orderBy: { createdAt: "desc" },
//     include: {
//       owner: true,
//       auction: true, // include auction info
//     }, // nested relation
//   });
// }

// export async function getNFTByTokenId(
//   tokenId: number,
// ): Promise<PrismaNFT | null> {
//   return db.nFT.findUnique({ where: { tokenId } });
// }

// export async function getNFTsByCreator(
//   creatorId: number,
// ): Promise<PrismaNFT[]> {
//   return db.nFT.findMany({
//     where: { creatorId },
//     orderBy: { createdAt: "desc" },
//   });
// }

// export async function getNFTsByOwner(
//   ownerId: number,
//   needLike: boolean = false,
//   needAuction: boolean = false,
//   needOwner: boolean = false,
// ): Promise<
//   (PrismaNFT & {
//     likes?: NFTLikeModel[];
//     auction?: AuctionModel | null; // ✅ FIX
//     owner?: UserModel;
//   })[]
// > {
//   return db.nFT.findMany({
//     where: { ownerId },
//     orderBy: { createdAt: "desc" },
//     include: {
//       likes: needLike,
//       auction: needAuction,
//       owner: needOwner,
//     },
//   });
// }

// /* --------------------
//    UPDATE
// -------------------- */
// export async function updateNFT(
//   id: number,
//   data: NFTUpdateInput,
// ): Promise<PrismaNFT> {
//   return db.nFT.update({ where: { id }, data });
// }

// export async function transferOwnership(
//   tokenId: number,
//   newOwnerId: number,
// ): Promise<PrismaNFT> {
//   // Update the ownerId of the NFT
//   return db.nFT.update({
//     where: { tokenId },
//     data: {
//       isListed: false,
//       approvedMarket: false,
//       approvedAuction: false,
//       owner: {
//         connect: {
//           id: newOwnerId,
//         },
//       },
//     },
//   });
// }

// /* --------------------
//    DELETE
// -------------------- */
// export async function deleteNFT(id: number): Promise<PrismaNFT> {
//   return db.nFT.delete({ where: { id } });
// }

// export async function approveAuctionNFT(nftId: number) {
//   return db.nFT.update({
//     where: { id: nftId },
//     data: { approvedAuction: true },
//   });
// }

// export async function approveMarketNFT(nftId: number) {
//   return db.nFT.update({
//     where: { id: nftId },
//     data: { approvedMarket: true },
//   });
// }

"use server";

import { db } from "@/lib/prisma";
import type {
  NFTModel as PrismaNFT,
  NFTCreateInput,
  NFTUpdateInput,
  UserModel,
  NFTLikeModel,
  AuctionModel,
} from "@/generated/prisma/models";
import {  pushToAbly } from "@/lib/ably";

/* --------------------
   Ably helper function
-------------------- */

async function pushNFTEvent(nft: PrismaNFT, action: string) {
  // 1️⃣ Insert into Outbox
  await db.outbox.create({
    data: {
      entity: "NFT",
      entityId: nft.id,
      action,
      payload: nft,
    },
  });

    await pushToAbly(`nft.${nft.id}`, "update", { action, nft });

}



/* --------------------
   CREATE
-------------------- */
export async function createNFT(data: NFTCreateInput): Promise<PrismaNFT> {
  const nft = await db.nFT.create({ data });
  await pushNFTEvent(nft, "create");
  return nft;
}

/* --------------------
   READ
-------------------- */
export async function getNFTById(id: number): Promise<PrismaNFT | null> {
  return db.nFT.findUnique({ where: { id } });
}

export async function getAllNFTs(): Promise<
  (PrismaNFT & { owner: UserModel | null; auction: AuctionModel | null })[]
> {
  return db.nFT.findMany({
    where: {
      isListed: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      auction: true, // include auction info
    }, // nested relation
  });
}

export async function getNFTByTokenId(
  tokenId: number,
): Promise<PrismaNFT | null> {
  return db.nFT.findUnique({ where: { tokenId } });
}

export async function getNFTsByCreator(
  creatorId: number,
): Promise<PrismaNFT[]> {
  return db.nFT.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getNFTsByOwner(
  ownerId: number,
  needLike: boolean = false,
  needAuction: boolean = false,
  needOwner: boolean = false,
): Promise<
  (PrismaNFT & {
    likes?: NFTLikeModel[];
    auction?: AuctionModel | null; // ✅ FIX
    owner?: UserModel;
  })[]
> {
  return db.nFT.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: {
      likes: needLike,
      auction: needAuction,
      owner: needOwner,
    },
  });
}

/* --------------------
   UPDATE
-------------------- */
export async function updateNFT(
  id: number,
  data: NFTUpdateInput,
): Promise<PrismaNFT> {
   const nft = await db.nFT.update({ where: { id }, data });
  await pushNFTEvent(nft, "update");
  return nft;

}

export async function transferOwnership(
  tokenId: number,
  newOwnerId: number,
): Promise<PrismaNFT> {
  // Update the ownerId of the NFT
  const nft = await db.nFT.update({
    where: { tokenId },
    data: {
      isListed: false,
      approvedMarket: false,
      approvedAuction: false,
      owner: { connect: { id: newOwnerId } },
    },
  });

  await pushNFTEvent(nft, "transfer");
  return nft;
}



export async function approveAuctionNFT(nftId: number) {
 const nft = await db.nFT.update({
    where: { id: nftId },
    data: { approvedAuction: true },
  });
  await pushNFTEvent(nft, "approveAuction");
  return nft;
}

export async function approveMarketNFT(nftId: number) {
   const nft = await db.nFT.update({
    where: { id: nftId },
    data: { approvedMarket: true },
  });
  await pushNFTEvent(nft, "approveMarket");
  return nft;
}

/* --------------------
   DELETE
-------------------- */
export async function deleteNFT(id: number): Promise<PrismaNFT> {
  const nft = await db.nFT.delete({ where: { id } });
  await pushNFTEvent(nft, "delete");
  return nft;
}