"use client"
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import SidebarHeader from '@/components/sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useRouter } from 'next/navigation'

import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import Footer from '@/components/footer'
const Layout = ({ children }: { children: React.ReactNode }) => {
  const {address,isConnected,isConnecting,isReconnecting} = useAccount()
  const router = useRouter();
  useEffect(() => {
    if(!isConnected && !(isConnecting || isReconnecting) ){
      router.push('/');
      toast.error("Please connect your wallet to access the dashboard.");
    }
    
  }, [isConnected, isConnecting, isReconnecting, router])
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarHeader/>
        
    {((isConnecting || isReconnecting))
    ?  children
    : <div className="min-h-[calc(100vh-64px)] grid items-center text-center">Connecting to your account...</div>}
      <Footer/>
      </SidebarInset>
    </SidebarProvider>

  )
}

export default Layout
