"use server";

import { db } from "@/lib/prisma";
import {
  FileCreateInput,
  FileUpdateInput,
  FileModel as PrismaFile,
  
} from "@/generated/prisma/models";

/* ----------------------------------------
   CREATE
---------------------------------------- */
export async function createFile(
  data: FileCreateInput
): Promise<PrismaFile> {
  return db.file.create({
    data,
  });
}

/* ----------------------------------------
   READ
---------------------------------------- */

// Get all files by wallet
export async function getFilesByWallet(
  walletId: string,
  minted?: boolean
): Promise<PrismaFile[]> {
  return db.file.findMany({
    where: {
      walletId,
      ...(minted !== undefined ? { isMinted: minted } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Get single file by ID
export async function getFileById(
  id: string
): Promise<PrismaFile | null> {
  return db.file.findUnique({
    where: { id },
  });
}

export async function getFileTypeByIPFS(ipfs: string): Promise<string | null> {
  const file = await db.file.findFirst({
    where: { ipfsUrl: ipfs },
    select: { type: true }, // only fetch the "type" field
  });

  return file?.type || null;
}


/* ----------------------------------------
   UPDATE
---------------------------------------- */

// Update one file
export async function updateFile(
  id: string,
  data: FileUpdateInput
): Promise<PrismaFile> {
  return db.file.update({
    where: { id },
    data,
  });
}

// Update all files for a wallet
export async function updateFilesByWallet(
  walletId: string,
  data: FileUpdateInput
): Promise<{ count: number }> {
  return db.file.updateMany({
    where: { walletId },
    data,
  });
}

/* ----------------------------------------
   DELETE
---------------------------------------- */

// Delete single file
export async function deleteFile(
  id: string
): Promise<PrismaFile> {
  return db.file.delete({
    where: { id },
  });
}

// Delete all files for a wallet
export async function deleteFilesByWallet(
  walletId: string
): Promise<{ count: number }> {
  return db.file.deleteMany({
    where: { walletId },
  });
}
