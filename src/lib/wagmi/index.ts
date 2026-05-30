"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { apolloMainnet } from "./apollo-chain";
import { createConnector } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  APOLLO_WALLET_CHROME_STORE_URL,
  APOLLO_WALLET_WEBSITE_URL,
  disconnectApolloWallet,
  getApolloWalletIcon,
  getApolloWalletName,
  getApolloWalletProvider,
  getApolloWalletRdns,
  isApolloWalletInstalled,
  markApolloSessionDisconnected,
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
  // Must be explicit boolean — `undefined` makes RainbowKit treat the wallet as ready
  // and wagmi's injected connector falls back to window.ethereum (MetaMask).
  installed:
    typeof window !== "undefined" ? isApolloWalletInstalled() : false,
  downloadUrls: {
    browserExtension: APOLLO_WALLET_CHROME_STORE_URL,
    chrome: APOLLO_WALLET_CHROME_STORE_URL,
  },
  extension: {
    instructions: {
      learnMoreUrl: APOLLO_WALLET_WEBSITE_URL,
      steps: [
        {
          step: "install" as const,
          title: "Install Apollo Wallet",
          description:
            "Install the Apollo Wallet browser extension from the Chrome Web Store, or visit apollowallet.io to get started.",
        },
        {
          step: "refresh" as const,
          title: "Refresh the page",
          description: "After installing, reload this page then connect again.",
        },
      ],
    },
  },
  createConnector: (walletDetails: any) => {
    return createConnector((config) => {
      const connector = injected({
        target: () => {
          const name = getApolloWalletName();
          if (typeof window === "undefined") {
            // Always return a target object — returning undefined makes injected() use window.ethereum.
            return { id: "apollo", name, provider: undefined };
          }

          const provider = getApolloWalletProvider();
          return {
            id: "apollo",
            name,
            provider: provider ?? undefined,
          };
        },
        shimDisconnect: false,
      })(config);

      return {
        ...connector,
        ...walletDetails,
        async disconnect() {
          markApolloSessionDisconnected();
          try {
            await disconnectApolloWallet();
          } catch {
            // Apollo disconnect is best-effort; wagmi disconnect still runs below.
          }
          return connector.disconnect();
        },
      };
    });
  },
});

export const config = getDefaultConfig({
  appName: "NFT Minting Studio",
  projectId,
  chains: [apolloMainnet],
  ssr: false,
  // Avoid duplicate EIP-6963 connectors that bypass our Apollo disconnect handler
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
