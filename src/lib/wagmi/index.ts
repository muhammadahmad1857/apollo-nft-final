"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { apolloMainnet } from "./apollo-chain";
import { createConnector } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  getApolloWalletProvider,
  getApolloWalletRdns,
  isApolloWalletInstalled,
} from "./apollo-wallet-provider";
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "nft-studio";

const apolloWallet = () => ({
  id: "apollo",
  name: "Apollo Wallet",
  rdns: getApolloWalletRdns(),
  iconUrl: async () =>
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%237c3aed'/%3E%3Cstop offset='100%25' stop-color='%2306b6d4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect rx='24' width='96' height='96' fill='url(%23g)'/%3E%3Cpath d='M48 22l18 10v22L48 64 30 54V32z' fill='white'/%3E%3C/svg%3E",
  iconBackground: "#111827",
  installed: isApolloWalletInstalled(),
  downloadUrls: {
    browserExtension: "https://apollowallet.io/",
  },
  createConnector: (walletDetails: any) => {
    return createConnector((config) => ({
      ...injected({
        target: () => ({
          id: "apollo",
          name: "Apollo Wallet",
          provider: getApolloWalletProvider(),
        }),
        shimDisconnect: false,
      })(config),
      ...walletDetails,
    }));
  },
});

export const config = getDefaultConfig({
  appName: "NFT Minting Studio",
  projectId,
  chains: [apolloMainnet],
  ssr: false,
  // Use our Apollo adapter instead of raw EIP-6963 auto-discovery (which hangs)
  multiInjectedProviderDiscovery: false,
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        apolloWallet,
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
});
