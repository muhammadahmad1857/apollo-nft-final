/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from 'react'
// Side-effect import: EIP-6963 capture listener must register before wagmi config loads
import "@/lib/wagmi/apollo-wallet-provider";
import { config } from "@/lib/wagmi";
import { initApolloWalletDiscovery } from "@/lib/wagmi/apollo-wallet-provider";
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { MarketplaceStreamBridge } from "@/components/marketplace-stream-bridge";
const queryClient = new QueryClient();
import ProvidersDebug from "@/components/ProvidersDebug";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

const Provider = ({children}:{children:React.ReactNode}) => {
  React.useEffect(() => {
    return initApolloWalletDiscovery();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <MarketplaceStreamBridge />
            <Toaster richColors closeButton />

            {/* Show provider debug UI when URL contains ?showProviders=1 */}
            {typeof window !== "undefined" && window.location.search.includes("showProviders=1") && (
              <ProvidersDebug />
            )}

            {children}
          </ThemeProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default Provider