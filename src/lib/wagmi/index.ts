"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { apolloMainnet } from "./apollo-chain";
import { createConnector } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  APOLLO_WALLET_CHROME_STORE_URL,
  getApolloWalletIcon,
  getApolloWalletName,
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

/**
 * Apollo Wallet — Popular entry with Chrome install CTA when missing.
 * When installed, EIP-6963 auto-discovery shows it under Installed (deduped by rdns).
 */
const apolloWallet = () => ({
  id: "apollo",
  name: getApolloWalletName(),
  rdns: getApolloWalletRdns(),
  iconUrl: async () => getApolloWalletIcon(),
  iconBackground: "#1a1408",
  installed:
    typeof window !== "undefined"
      ? isApolloWalletInstalled() || undefined
      : undefined,
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
            name: getApolloWalletName(),
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
