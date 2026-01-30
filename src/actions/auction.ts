"use server";

import { db } from "@/lib/prisma";
import type { AuctionModel as PrismaAuction, AuctionCreateInput, AuctionUpdateInput, BidModel,  NFTModel, UserModel } from "@/generated/prisma/models";

/* --------------------
   CREATE
-------------------- */
export async function createAuction(data: AuctionCreateInput): Promise<PrismaAuction> {
  return db.auction.create({ data });
}

/* --------------------
   READ
-------------------- */
export async function getAuctionById(id: number): Promise<PrismaAuction | null> {
  return db.auction.findUnique({ where: { id } });
}

export async function getAuctionByNFT(nftId: number): Promise<(PrismaAuction & { seller: UserModel,nft:NFTModel,highestBidder:UserModel | null,bids:BidModel[]})|null> {
  return db.auction.findUnique({ where: { nftId }   ,  include:{nft:true,seller:true,highestBidder:true,bids:true,}
});
}

export async function getAuctionsBySeller(sellerId: number): Promise<PrismaAuction[]> {
  return db.auction.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" } });
}

export async function getActiveAuctions(): Promise<(PrismaAuction & { seller: UserModel,nft:NFTModel,highestBidder:UserModel | null,bids:BidModel[]})[]> {
  const now = new Date();
  return db.auction.findMany({
    where: { startTime: { lte: now }, endTime: { gte: now }, settled: false },
    orderBy: { startTime: "desc" },
    include:{nft:true,seller:true,highestBidder:true,bids:true,}
  });
}

/* --------------------
   UPDATE
-------------------- */
export async function updateAuction(id: number, data: AuctionUpdateInput): Promise<PrismaAuction> {
  return db.auction.update({ where: { id }, data });
}

/* --------------------
   DELETE
-------------------- */
export async function deleteAuction(id: number): Promise<PrismaAuction> {
  return db.auction.delete({ where: { id } });
}
