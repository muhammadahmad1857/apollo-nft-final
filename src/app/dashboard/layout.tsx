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
import { BlockedUserNotice } from '@/components/blocked-user-notice'
import PendingMintPoller from '@/components/PendingMintPoller'
const Layout = ({ children }: { children: React.ReactNode }) => {
  const {address,isConnected,isConnecting,isReconnecting} = useAccount()
  const { data: user, isLoading: isUserLoading } = useUser(address || "")
  const pathname = usePathname()
  const router = useRouter();

  const canAccessWhenBlocked =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') && (
      pathname === '/dashboard/favorites' ||
      pathname.startsWith('/dashboard/favorites/') ||
      pathname === '/dashboard/playlist' ||
      pathname.startsWith('/dashboard/playlist/')
    ) ||
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
      <BlockedUserNotice
        className='my-10'
        message='You can only access Notifications and Edit Profile right now. If this is a mistake, contact us at hello@blaqclouds.io.'
      />
    ) : (
      children
    )}
      <Footer/>
      {isConnected && <PendingMintPoller />}
      </SidebarInset>
    </SidebarProvider>

  )
}

export default Layout
