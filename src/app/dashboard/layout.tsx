import { AppSidebar } from '@/components/app-sidebar'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/themeToggle'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@radix-ui/react-separator'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import React from 'react'

const Layout = ({ children }: { children: React.ReactNode }) => {
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
          <header className=" bg-background/80 backdrop-blur-md border-b border-border">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                 {/* <Logo/> */}
      <SidebarTrigger className="-ml-1" />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4"
                    />
        <div className="flex items-center gap-2 px-4">
                    
                  
                    {/* Theme toggle */}
                  <ThemeToggle />
                  <ConnectButton />
                  </div>
                </div>
              </header>
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
      </SidebarInset>
    </SidebarProvider>

  )
}

export default Layout
