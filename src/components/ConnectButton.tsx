"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useCreateUser } from "@/hooks/useCreateUser";

export default function WalletAuth() {
  const { address, isConnected } = useAccount();
  const { data: user, isLoading } = useUser(address);
  const createUser = useCreateUser();

  const [username, setUsername] = useState("");

  if (!isConnected) return <ConnectButton />;

  if (isLoading) return <p>Checking identity 🔍</p>;

  if (user) {
    return <p>Logged in as @{user.username} 🖤</p>;
  }

  const autoUsername = `user_${address?.slice(2, 6)}${address?.slice(-4)}`;

  return (
    <div>
      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <button
        onClick={() =>
          createUser.mutate({
            walletAddress: address!,
            username: username || autoUsername,
          })
        }
      >
        Continue
      </button>
    </div>
  );
}
