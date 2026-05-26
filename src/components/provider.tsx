/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useEffect } from 'react'
import { config } from "@/lib/wagmi";
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { MarketplaceStreamBridge } from "@/components/marketplace-stream-bridge";
const queryClient = new QueryClient();



export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

const Provider = ({children}:{children:React.ReactNode}) => {
  // Detect if multiple injected providers exist and pick Muses provider if present.
  // Some wallets (like Muses) inject into `window.ethereum.providers` alongside MetaMask.
  useEffect(() => {
    try {
      const win = window as any;
      if (win?.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
        const providers = win.ethereum.providers;
        const muses = providers.find((p: any) => p.isMuses === true || p.isMusesWallet === true || p.isMusesWallet === true);
        if (muses) {
          // Prefer the Muses provider as the primary `window.ethereum` so RainbowKit/Wagmi sees it.
          win.ethereum = muses;
        }
      }
    } catch (e) {
      // ignore client-side detection errors
    }
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

          {children}
        </ThemeProvider>
          
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
  )
}

export default Provider