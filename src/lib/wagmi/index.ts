"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { apolloMainnet } from "./apollo-chain";
import { injected } from "wagmi/connectors";

// Minimal custom wallet for Muses — this surfaces a named 'Muses Wallet'
// entry in the RainbowKit connect modal and uses the injected connector.
const musesWallet: any = {
  id: "muses",
  name: "Muses Wallet",
  iconUrl: undefined,
  iconBackground: "#0B0",
  createConnector: () => {
    return { connector: injected() };
  },
};

export const config = getDefaultConfig({
  appName: "NFT Minting Studio",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "nft-studio",
  chains: [apolloMainnet],
  ssr: false,
  wallets: [
    {
      groupName: "Injected",
      wallets: [musesWallet],
    },
  ],
});