"use server"
import {db} from '@/lib/prisma'; // your prisma client
import { Prisma, User } from '@prisma/client';

// --- CREATE ---
export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  return db.user.upsert({ where: { walletAddress: data.walletAddress }, update: data, create: data });
}

// --- READ ---
export async function getUserById(id: number): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  return db.user.findUnique({ where: { walletAddress } });
}

export async function getAllUsers(take?: number, skip?: number): Promise<User[]> {
  return db.user.findMany({ take, skip, orderBy: { createdAt: 'desc' } });
}

// --- UPDATE ---
export async function updateUser(
  id: number,
  data: Prisma.UserUpdateInput
): Promise<User> {
  return db.user.update({
    where: { id },
    data,
  });
}

export async function updateUserByWallet(
  walletAddress: string,
  data: Prisma.UserUpdateInput
): Promise<User> {
  return db.user.update({
    where: { walletAddress },
    data,
  });
}

// --- UPSERT ---
export async function upsertUser(
  walletAddress: string,
  data: Prisma.UserCreateInput & Prisma.UserUpdateInput
): Promise<User> {
  return db.user.upsert({
    where: { walletAddress },
    create: data,
    update: data,
  });
}

// --- DELETE ---
export async function deleteUser(id: number): Promise<User> {
  return db.user.delete({ where: { id } });
}

export async function deleteUserByWallet(walletAddress: string): Promise<User> {
  return db.user.delete({ where: { walletAddress } });
}
