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

function isBooleanUpdateTrue(value: unknown): boolean {
  if (value === true) return true;
  if (
    typeof value === "object" &&
    value !== null &&
    "set" in value &&
    (value as { set?: unknown }).set === true
  ) {
    return true;
  }
  return false;
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
      isArchived: false,
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
      isArchived: false,
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
    select: { moderationStatus: true, ownerId: true, isArchived: true },
  });
  if (!nft) throw new Error("NFT not found");

  await ensureUserNotBlockedById(nft.ownerId);

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be updated for trading.");
  }

  const isTryingToListOrApprove =
    isBooleanUpdateTrue((data as { isListed?: unknown }).isListed) ||
    isBooleanUpdateTrue((data as { approvedAuction?: unknown }).approvedAuction) ||
    isBooleanUpdateTrue((data as { approvedMarket?: unknown }).approvedMarket);

  if (nft.isArchived && isTryingToListOrApprove) {
    throw new Error("Archived NFTs cannot be listed or approved for trading.");
  }

  if (
    Object.prototype.hasOwnProperty.call(data, "isArchived") ||
    Object.prototype.hasOwnProperty.call(data, "archivedAt")
  ) {
    throw new Error("Use archive/unarchive actions to manage archive status.");
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
      isArchived: false,
      archivedAt: null,
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
    select: { ownerId: true, moderationStatus: true, isArchived: true },
  });
  if (!nft) throw new Error("NFT not found");

  await ensureUserNotBlockedById(nft.ownerId);

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be approved for auction.");
  }

  if (nft.isArchived) {
    throw new Error("Archived NFTs cannot be approved for auction.");
  }

  return db.nFT.update({
    where: { id: nftId },
    data: { approvedAuction: true },
  });
}

export async function approveMarketNFT(nftId: number) {
  const nft = await db.nFT.findUnique({
    where: { id: nftId },
    select: { ownerId: true, moderationStatus: true, isArchived: true },
  });
  if (!nft) throw new Error("NFT not found");

  await ensureUserNotBlockedById(nft.ownerId);

  if (isTradeBlockedByModeration(nft.moderationStatus)) {
    throw new Error("This NFT is moderated and cannot be approved for marketplace.");
  }

  if (nft.isArchived) {
    throw new Error("Archived NFTs cannot be approved for marketplace.");
  }

  return db.nFT.update({
    where: { id: nftId },
    data: { approvedMarket: true },
  });
}

export async function archiveNFT(nftId: number, ownerId: number): Promise<PrismaNFT> {
  const nft = await db.nFT.findUnique({
    where: { id: nftId },
    select: { id: true, ownerId: true, isListed: true, isArchived: true },
  });
  if (!nft) throw new Error("NFT not found");
  if (nft.ownerId !== ownerId) {
    throw new Error("Only the owner can archive this NFT.");
  }

  await ensureUserNotBlockedById(ownerId);

  if (nft.isListed) {
    throw new Error("Listed NFTs cannot be archived. Delist first.");
  }

  const now = new Date();
  const activeAuction = await db.auction.findFirst({
    where: {
      nftId,
      settled: false,
      startTime: { lte: now },
      endTime: { gt: now },
    },
    select: { id: true },
  });

  if (activeAuction) {
    throw new Error("NFT with an active auction cannot be archived.");
  }

  if (nft.isArchived) {
    return db.nFT.findUniqueOrThrow({ where: { id: nftId } });
  }

  return db.nFT.update({
    where: { id: nftId },
    data: {
      isArchived: true,
      archivedAt: now,
      approvedAuction: false,
      approvedMarket: false,
    },
  });
}

export async function unarchiveNFT(nftId: number, ownerId: number): Promise<PrismaNFT> {
  const nft = await db.nFT.findUnique({
    where: { id: nftId },
    select: { id: true, ownerId: true, isListed: true, isArchived: true },
  });
  if (!nft) throw new Error("NFT not found");
  if (nft.ownerId !== ownerId) {
    throw new Error("Only the owner can unarchive this NFT.");
  }

  await ensureUserNotBlockedById(ownerId);

  if (nft.isListed) {
    throw new Error("Listed NFTs cannot be unarchived until delisted.");
  }

  const now = new Date();
  const activeAuction = await db.auction.findFirst({
    where: {
      nftId,
      settled: false,
      startTime: { lte: now },
      endTime: { gt: now },
    },
    select: { id: true },
  });

  if (activeAuction) {
    throw new Error("NFT with an active auction cannot be unarchived.");
  }

  if (!nft.isArchived) {
    return db.nFT.findUniqueOrThrow({ where: { id: nftId } });
  }

  return db.nFT.update({
    where: { id: nftId },
    data: {
      isArchived: false,
      archivedAt: null,
    },
  });
}
