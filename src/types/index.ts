// Centralized types for Apollo NFT project

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
  price:number
}

export interface PinataJSON{
  name:string,
  description:string,
  cover?:string,
  media:string,
  title:string
  price:number
}