"use client"
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import SidebarHeader from '@/components/sidebar/sidebar-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { usePathname, useRouter } from 'next/navigation'
import Loader from '@/components/loader'

import React, { useEffect } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import Footer from '@/components/footer'
import { useUser } from '@/hooks/useUser'
const Layout = ({ children }: { children: React.ReactNode }) => {
  const {address,isConnected,isConnecting,isReconnecting} = useAccount()
  const { data: user, isLoading: isUserLoading } = useUser(address || "")
  const pathname = usePathname()
  const router = useRouter();

  const canAccessWhenBlocked =
    pathname === '/dashboard/edit-profile' ||
    pathname.startsWith('/dashboard/edit-profile/') ||
    pathname === '/dashboard/notifications' ||
    pathname.startsWith('/dashboard/notifications/')

  useEffect(() => {
    if(!isConnected && !(isConnecting || isReconnecting) ){
      router.push('/');
      toast.error("Please connect your wallet to access the dashboard.");
    }
    
  }, [isConnected, isConnecting, isReconnecting, router])
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='bg-transparent'>
        <SidebarHeader/>

    {!(isConnected && !(isConnecting || isReconnecting)) ? (
      <Loader text="Connecting to your wallet..."  />
    ) : isUserLoading ? (
      <Loader text="Checking account status..." />
    ) : user?.isBlocked && !canAccessWhenBlocked ? (
      <div className='mx-auto my-10 max-w-2xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center'>
        <h2 className='text-2xl font-bold text-destructive'>Your account is blocked</h2>
        <p className='mt-3 text-sm text-muted-foreground'>
          You can only access Notifications and Edit Profile right now. If this is a mistake, contact us at hello@blaqclouds.io.
        </p>
      </div>
    ) : (
      children
    )}
      <Footer/>
      </SidebarInset>
    </SidebarProvider>

  )
}

export default Layout
