"use client";

import { useEffect } from "react";
import { watchAccount } from "@wagmi/core";
import { config } from "@/lib/wagmi";
import {
  clearApolloSessionDisconnected,
  disconnectApolloWallet,
  isApolloConnector,
  markApolloSessionDisconnected,
} from "@/lib/wagmi/apollo-wallet-provider";

/**
 * Safety net: when wagmi disconnects an Apollo connector (any path),
 * ensure the session flag is set so eth_accounts stops auto-reconnecting.
 */
export function ApolloWalletSessionBridge() {
  useEffect(() => {
    return watchAccount(config, {
      onChange(account, prevAccount) {
        const apolloConnector =
          isApolloConnector(account.connector) || isApolloConnector(prevAccount.connector);

        if (!apolloConnector) return;

        if (prevAccount.status === "connected" && account.status === "disconnected") {
          markApolloSessionDisconnected();
          void disconnectApolloWallet();
        }

        if (account.status === "connected" && account.address) {
          clearApolloSessionDisconnected();
        }
      },
    });
  }, []);

  return null;
}
