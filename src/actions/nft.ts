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

export async function getAllNFTs(likes:boolean=false): Promise<
  (PrismaNFT & { owner: UserModel | null; auction: AuctionModel | null,likes?:NFTLikeModel[] })[]
> {
  return db.nFT.findMany({
    where: {
      isListed: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      auction: true, // include auction info
      likes: likes, // include likes if requested
    }, // nested relation
  });
}

export async function getNFTByTokenId(
  tokenId: number,
): Promise<(PrismaNFT & { owner: UserModel | null }) | null> {
  return db.nFT.findUnique({
    where: { tokenId },
    include: { owner: true },
  });
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
  return db.nFT.update({ where: { id }, data });
}

export async function transferOwnership(
  tokenId: number,
  newOwnerId: number,
): Promise<PrismaNFT> {
  // Update the ownerId of the NFT
  return db.nFT.update({
    where: { tokenId },
    data: {
      isListed: false,
      approvedMarket: false,
      approvedAuction: false,
      owner: {
        
        connect: {
          id: newOwnerId,
        },
      },
    },
  });
}

/* --------------------
   DELETE
-------------------- */
export async function deleteNFT(id: number): Promise<PrismaNFT> {
  return db.nFT.delete({ where: { id } });
}

export async function approveAuctionNFT(nftId: number) {
  return db.nFT.update({
    where: { id: nftId },
    data: { approvedAuction: true },
  });
}

export async function approveMarketNFT(nftId: number) {
  return db.nFT.update({
    where: { id: nftId },
    data: { approvedMarket: true },
  });
}
