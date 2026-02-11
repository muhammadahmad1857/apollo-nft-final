"use client"
import React from 'react'
import { config } from "@/lib/wagmi";
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
const queryClient = new QueryClient();



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
        <Toaster richColors closeButton />

          {children}
        </ThemeProvider>
          
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
  )
}

export default Provider