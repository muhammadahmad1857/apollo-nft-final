"use server";

import { db } from "@/lib/prisma";
import {
  UserCreateInput,
  UserUpdateInput,
  UserModel as PrismaUser,
} from "@/generated/prisma/models";

/* ----------------------------------------
   CREATE / UPSERT (by wallet)
---------------------------------------- */
export async function createUser(
  data: UserCreateInput
): Promise<PrismaUser> {
  return db.user.upsert({
    where: { walletAddress: data.walletAddress },
    update: data,
    create: data,
  });
}

/* ----------------------------------------
   READ
---------------------------------------- */

// Get user by ID
export async function getUserById(
  id: number
): Promise<PrismaUser | null> {
  return db.user.findUnique({
    where: { id },
  });
}

// Get user by wallet address
export async function getUserByWallet(
  walletAddress: string
): Promise<PrismaUser | null> {
  return db.user.findUnique({
    where: { walletAddress },
  });
}

// Get all users (pagination supported)
export async function getAllUsers(
  take?: number,
  skip?: number
): Promise<PrismaUser[]> {
  return db.user.findMany({
    take,
    skip,
    orderBy: {
      createdAt: "desc",
    },
  });
}

/* ----------------------------------------
   UPDATE
---------------------------------------- */

// Update user by ID
export async function updateUser(
  id: number,
  data: UserUpdateInput
): Promise<PrismaUser> {
  return db.user.update({
    where: { id },
    data,
  });
}

// Update user by wallet address
export async function updateUserByWallet(
  walletAddress: string,
  data: UserUpdateInput
): Promise<PrismaUser> {
  return db.user.update({
    where: { walletAddress },
    data,
  });
}

/* ----------------------------------------
   UPSERT (explicit)
---------------------------------------- */
export async function upsertUser(
  walletAddress: string,
  data: UserCreateInput & UserUpdateInput
): Promise<PrismaUser> {
  return db.user.upsert({
    where: { walletAddress },
    create: data,
    update: data,
  });
}

/* ----------------------------------------
   DELETE
---------------------------------------- */

// Delete user by ID
export async function deleteUser(
  id: number
): Promise<PrismaUser> {
  return db.user.delete({
    where: { id },
  });
}

// Delete user by wallet address
export async function deleteUserByWallet(
  walletAddress: string
): Promise<PrismaUser> {
  return db.user.delete({
    where: { walletAddress },
  });
}


// export async function approveAuctionUser(userId: number) {
//   return db.user.update({
//     where: { id: userId },
//     data: { approvedAuction: true },
//   });
// }

// export async function approveMarketUser(userId: number) {
//   return db.user.update({
//     where: { id: userId },
//     data: { approvedMarket: true },
//   });
// }
