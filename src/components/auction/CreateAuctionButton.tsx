"use client"
import { useAccount } from "wagmi";
import Link from "next/link";

export default function CreateAuctionButton() {
  const { isConnected } = useAccount();
  if (!isConnected) return null;
  return (
    <Link href="/dashboard/create">
      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow">Create Auction</button>
    </Link>
  );
}
