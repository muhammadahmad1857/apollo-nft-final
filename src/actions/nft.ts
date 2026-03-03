"use server";

import { db } from "@/lib/prisma";
import { NftModerationStatus } from "@/generated/prisma/enums";
import type {
  NFTModel as PrismaNFT,
  NFTCreateInput,
  NFTUpdateInput,
  UserModel,
  NFTLikeModel,
  AuctionModel,
} from "@/generated/prisma/models";

const SUPPORT_EMAIL = "hello@blaqclouds.io";

function isTradeBlockedByModeration(status: NftModerationStatus): boolean {
  return (
    status === NftModerationStatus.DELISTED ||
    status === NftModerationStatus.HIDDEN
  );
}

async function ensureUserNotBlockedById(userId: number): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isBlocked: true },
  });

  if (user?.isBlocked) {
    throw new Error(
      `Your account is blocked. Contact us at ${SUPPORT_EMAIL} if this is a mistake.`,
    );
  }
}

async function ensureNftTradableByTokenId(tokenId: number): Promise<void> {
  const nft = await db.nFT.findUnique({
    where: { tokenId },
    select: { moderationStatus: true },
  });

  if (!nft) throw new Error("NFT not found");

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be used for this action.");
  }
}

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
  return db.nFT.findFirst({
    where: {
      id,
      moderationStatus: {
        not: NftModerationStatus.HIDDEN,
      },
    },
  });
}

export async function getAllNFTs(likes:boolean=false): Promise<
  (PrismaNFT & { owner: UserModel | null; auction: AuctionModel | null,likes?:NFTLikeModel[] })[]
> {
  return db.nFT.findMany({
    where: {
      isListed: true,
      moderationStatus: {
        in: [NftModerationStatus.ACTIVE, NftModerationStatus.FLAGGED],
      },
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
  return db.nFT.findFirst({
    where: {
      tokenId,
      moderationStatus: {
        not: NftModerationStatus.HIDDEN,
      },
    },
    include: { owner: true },
  });
}

export async function getVisibleNFTByTokenId(
  tokenId: number,
): Promise<(PrismaNFT & { owner: UserModel | null }) | null> {
  return db.nFT.findFirst({
    where: {
      tokenId,
      moderationStatus: {
        in: [NftModerationStatus.ACTIVE, NftModerationStatus.FLAGGED],
      },
    },
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
    where: {
      ownerId,
      moderationStatus: {
        in: [NftModerationStatus.ACTIVE, NftModerationStatus.FLAGGED, NftModerationStatus.DELISTED],
      },
    },
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
  const nft = await db.nFT.findUnique({
    where: { id },
    select: { moderationStatus: true, ownerId: true },
  });
  if (!nft) throw new Error("NFT not found");

  await ensureUserNotBlockedById(nft.ownerId);

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be updated for trading.");
  }

  return db.nFT.update({ where: { id }, data });
}

export async function transferOwnership(
  tokenId: number,
  newOwnerId: number,
): Promise<PrismaNFT> {
  const nft = await db.nFT.findUnique({
    where: { tokenId },
    select: { ownerId: true, moderationStatus: true },
  });
  if (!nft) throw new Error("NFT not found");

  await ensureUserNotBlockedById(nft.ownerId);
  await ensureUserNotBlockedById(newOwnerId);
  await ensureNftTradableByTokenId(tokenId);

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
  const nft = await db.nFT.findUnique({
    where: { id: nftId },
    select: { ownerId: true, moderationStatus: true },
  });
  if (!nft) throw new Error("NFT not found");

  await ensureUserNotBlockedById(nft.ownerId);

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be approved for auction.");
  }

  return db.nFT.update({
    where: { id: nftId },
    data: { approvedAuction: true },
  });
}

export async function approveMarketNFT(nftId: number) {
  const nft = await db.nFT.findUnique({
    where: { id: nftId },
    select: { ownerId: true, moderationStatus: true },
  });
  if (!nft) throw new Error("NFT not found");

  await ensureUserNotBlockedById(nft.ownerId);

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be approved for marketplace.");
  }

  return db.nFT.update({
    where: { id: nftId },
    data: { approvedMarket: true },
  });
}
