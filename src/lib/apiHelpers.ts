import { db } from "@/lib/prisma";

/**
 * Resolves a wallet address to a User record.
 * Returns null if the address is missing or the user is not found.
 */
export async function resolveUser(walletAddress: string | null) {
  if (!walletAddress) return null;
  return db.user.findUnique({ where: { walletAddress } });
}
