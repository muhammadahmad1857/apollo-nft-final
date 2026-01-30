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
    if(!isConnected && (isConnecting || isReconnecting) ){
      router.push('/');
      toast.error("Please connect your wallet to access the dashboard.");
    }
    
  }, [isConnected, isConnecting, isReconnecting, router])
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarHeader/>
            {/* <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    {/* <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                          <BreadcrumbLink href="#">
                            Building Your Application
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </header> */}
      {children}
      <Footer/>
      </SidebarInset>
    </SidebarProvider>

  )
}

export default Layout
