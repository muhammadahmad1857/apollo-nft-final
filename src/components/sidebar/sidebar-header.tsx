"use client"
import React from 'react'
import { SidebarTrigger, useSidebar } from '../ui/sidebar'
import Logo from '../Logo'
import { Separator } from '@radix-ui/react-separator'
import ThemeToggle from '../themeToggle'
import  {CustomConnectButton} from '@/components/ConnectButton'

const SidebarHeader = () => {
    const {state} = useSidebar()
  return (
      <header className=" bg-background/20 backdrop-blur-md border-b border-border">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
      <Logo show={state==="collapsed"}/>
      <SidebarTrigger className={`-ml-1 ${state === "collapsed" ? "hidden" : "block"}`} />
                    <Separator
                      orientation="vertical"
                      className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    </div>
        <div className="flex items-center gap-2 px-4">
                    
                  
                    {/* Theme toggle */}
                  {/* <ThemeToggle /> */}
                  <CustomConnectButton />
                  </div>
                </div>
              </header>
  )
}

export default SidebarHeader
