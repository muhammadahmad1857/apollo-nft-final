// Centralized types for Apollo NFT project

import { AuctionModel, BidModel, NFTModel } from "@/generated/prisma/models";
import { db } from "@/lib/prisma";

export interface FileFromDB {
  type: string;
  ipfsUrl: string;
  filename: string;
}

export interface FileData {
  id: string;
  created_at: string;
  wallet_id: string;
  ipfsUrl: string;
  type: string;
  isMinted: boolean;
  filename?: string | null;
}

export interface MetadataContent {
  name?: string;
  title?: string;
  description?: string;
  cover?: string;
  media?: string;
}

export interface MetadataFormValues {
  name: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  musicTrackUrl: string;
}

export interface PinataJSON{
  name:string,
  description:string,
  cover?:string,
  media:string,
  title:string
}


export interface AuctionHistory {
  auction: AuctionModel & {
    nft: NFTModel;
    bids: BidModel[];
  };

  // derived fields (IMPORTANT)
  userLastBid: number | null;
  status: "active" | "ended" | "settled";
  isEnded: boolean;
  canSettle: boolean;
  timeLeft: number;
}
