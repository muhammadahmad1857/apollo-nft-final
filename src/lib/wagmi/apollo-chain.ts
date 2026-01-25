import { defineChain } from "viem";

export const apolloMainnet = defineChain({
  id: 62606,
  name: "Apollo Mainnet",
  network: "apollo",
  nativeCurrency: {
    name: "Apollo",
    symbol: "APOLLO",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet-rpc.apolloscan.io"],
    },
    public: {
      http: ["https://mainnet-rpc.apolloscan.io"],
    },
  },
  blockExplorers: {
    default: { name: "ApolloScan", url: "https://apolloscan.io" },
  },
});