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
 * Apollo Wallet — uses EIP-6963 rdns + icon from the extension so RainbowKit
 * shows it under Installed (not a duplicate generic browser wallet).
 * Connection goes through our adapter (fixes infinite loading).
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
  // EIP-6963 Installed section + our rdns-matched connector (dedupes raw Apollo)
  multiInjectedProviderDiscovery: true,
  wallets: [
    {
      groupName: "Installed",
      wallets: [apolloWallet],
    },
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
});
