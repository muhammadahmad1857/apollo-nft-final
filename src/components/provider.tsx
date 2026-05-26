/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from 'react'

// Run provider selection at module-load time so it executes before
// RainbowKit/Wagmi initialize (ensures injected Muses provider is
// preferred when multiple injected providers are present).
if (typeof window !== "undefined") {
  try {
    const win = window as any;
    if (win?.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
      const providers = win.ethereum.providers;
      const muses = providers.find((p: any) => p.isMuses === true || p.isMusesWallet === true || p.isMusesProvider === true);
      if (muses) {
        win.ethereum = muses;
      }
    }
    // Some wallets expose themselves on a global like `window.muses`.
    if (!win.ethereum && win.muses) {
      win.ethereum = win.muses;
    }
    // If there is a global `muses` alongside an injected ethereum provider,
    // prefer the muses provider when it appears to be a provider object.
    if (win.muses && typeof win.muses.request === "function") {
      win.ethereum = win.muses;
    }
  } catch (e) {
    // ignore client-side detection errors
  }
}
import { config } from "@/lib/wagmi";
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
  )
}

export default Provider