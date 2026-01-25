"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { apolloMainnet } from "./apollo-chain";

export const config = getDefaultConfig({
  appName: "NFT Minting Studio",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "nft-studio",
  chains: [apolloMainnet],
  ssr: false,
});