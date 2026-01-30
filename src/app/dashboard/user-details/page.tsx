"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Dummy withdraw hook for now
function useWithdraw() {
  const [isLoading, setIsLoading] = useState(false);
  const withdraw = async () => {
    setIsLoading(true);
    toast.info("Withdrawal in progress...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    toast.success("Withdrawal successful!");
  };
  return { withdraw, isLoading };
}

export default function UserDetailsPage() {
  const { address } = useAccount();
  const { data: user } = useUser(address || "");
  const { withdraw, isLoading } = useWithdraw();

  if (!user) return <div className="p-8">Connect your wallet to view your details.</div>;

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">User Details</h1>
      <div className="flex flex-col items-center gap-4 mb-8">
        <Avatar className="size-24">
          <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-xl font-bold">{user.name}</div>
        <div className="text-muted-foreground break-all">{user.walletAddress}</div>
      </div>
      <Button onClick={withdraw} disabled={isLoading} className="w-full">
        {isLoading ? "Withdrawing..." : "Withdraw"}
      </Button>
    </div>
  );
}
