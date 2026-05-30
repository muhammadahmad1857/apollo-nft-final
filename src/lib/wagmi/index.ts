"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { apolloMainnet } from "./apollo-chain";
import { createConnector } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  APOLLO_WALLET_CHROME_STORE_URL,
  getApolloWalletProvider,
  getApolloWalletRdns,
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
  // Always show on client; skip SSR so build/prerender never touches the extension
  installed: typeof window !== "undefined" ? true : undefined,
  downloadUrls: {
    browserExtension: APOLLO_WALLET_CHROME_STORE_URL,
    chrome: APOLLO_WALLET_CHROME_STORE_URL,
  },
  createConnector: (walletDetails: any) => {
    return createConnector((config) => ({
      ...injected({
        target: () => {
          if (typeof window === "undefined") return undefined;

          const provider = getApolloWalletProvider();
          if (!provider) return undefined;

          return {
            id: "apollo",
            name: "Apollo Wallet",
            provider,
          };
        },
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
  // Show other installed wallets again; our Apollo connector uses matching rdns + adapter
  multiInjectedProviderDiscovery: true,
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
