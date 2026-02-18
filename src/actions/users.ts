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

/* ----------------------------------------
   GET TRENDING SELLERS BY LIKES
---------------------------------------- */
export async function getTrendingSellers(limit: number = 2) {
  // Get all users with their owned NFTs and likes
  const users = await db.user.findMany({
    include: {
      
      nftsOwned: {
        include: {
          likes: true, // Get all likes on each NFT
        },
      },
    },
  });

  // Calculate total likes for each user and create seller objects
  const sellersWithMetrics = users.map((user) => {
    const totalLikes = user.nftsOwned.reduce((sum, nft) => sum + nft.likes.length, 0);
    const nftCount = user.nftsOwned.length;

    return {
      id: user.id,
      name: user.name,
      walletAddress: user.walletAddress,
      image: user.avatarUrl,
      totalLikes,
      nftCount,
      createdAt: user.createdAt,
    };
  });

  // Sort by total likes (desc), then by createdAt (desc for more recent users)
  sellersWithMetrics.sort((a, b) => {
    if (a.totalLikes !== b.totalLikes) {
      return b.totalLikes - a.totalLikes; // Descending by likes
    }
    return b.createdAt.getTime() - a.createdAt.getTime(); // Descending by createdAt (newer first)
  });

  // Return top N sellers
  return sellersWithMetrics.slice(0, limit);
}

/* ----------------------------------------
   SEARCH USERS
---------------------------------------- */
export async function searchUsers(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const users = await db.user.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query.trim(),
            mode: "insensitive",
          },
        },
        {
          walletAddress: {
            contains: query.trim(),
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
      walletAddress: true,
      name: true,
      avatarUrl: true,
    },
    take: 15,
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
}

/* ----------------------------------------
   GET ARTIST PROFILE DATA
---------------------------------------- */
export async function getArtistProfileData(walletAddress: string) {
  const user = await db.user.findUnique({
    where: { walletAddress },
    include: {
      nftsOwned: {
        where: {
          OR: [
            { isListed: true },
            { auction: { isNot: null } },
          ],
        },
        include: {
          auction: {
            include: {
              highestBidder: {
                select: {
                  walletAddress: true,
                  name: true,
                },
              },
            },
          },
          likes: true,
          owner: {
            select: {
              walletAddress: true,
              name: true,
              avatarUrl: true,
            },
          },
          creator: {
            select: {
              walletAddress: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Calculate stats
  const totalNFTs = user.nftsOwned.length;
  const activeListings = user.nftsOwned.filter((nft) => nft.isListed && !nft.auction).length;
  const activeAuctions = user.nftsOwned.filter((nft) => nft.auction).length;

  return {
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      name: user.name,
      avatarUrl: user.avatarUrl,
      email: user.email,
    },
    stats: {
      totalNFTs,
      activeListings,
      activeAuctions,
    },
    nfts: user.nftsOwned,
  };
}
