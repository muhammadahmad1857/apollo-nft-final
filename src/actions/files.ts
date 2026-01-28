"use server"
import db from '@/lib/prisma';
import { Prisma, File } from '@prisma/client';

// --- CREATE ---
export async function createFile(data: Prisma.FileCreateInput): Promise<File> {
  return db.file.create({ data });
}

// --- READ ---
// Find all files by wallet ID
export async function getFilesByWallet(walletId: string, minted?: boolean): Promise<File[]> {
  return db.file.findMany({
    where: {
      wallet_id: walletId,
      ...(minted !== undefined ? { isMinted: minted } : {}),
    },
    select: {
      id: true,
      ipfsUrl: true,
      filename: true,
      type: true,
      isMinted: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Find a single file by ID
export async function getFileById(id: number): Promise<File | null> {
  return db.file.findUnique({ where: { id } });
}

// --- UPDATE ---
// Update file by ID
export async function updateFile(id: number, data: Prisma.FileUpdateInput): Promise<File> {
  return db.file.update({
    where: { id },
    data,
  });
}

// Update multiple files by wallet ID
export async function updateFilesByWallet(walletId: string, data: Prisma.FileUpdateInput): Promise<Prisma.BatchPayload> {
  return db.file.updateMany({
    where: { wallet_id: walletId },
    data,
  });
}

// --- DELETE ---
// Delete file by ID
export async function deleteFile(id: number): Promise<File> {
  return db.file.delete({ where: { id } });
}

// Delete multiple files by wallet ID
export async function deleteFilesByWallet(walletId: string): Promise<Prisma.BatchPayload> {
  return db.file.deleteMany({ where: { wallet_id: walletId } });
}
