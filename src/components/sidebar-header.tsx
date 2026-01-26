"use client"
import React from 'react'
import { SidebarTrigger, useSidebar } from './ui/sidebar'
import Logo from './Logo'
import { Separator } from '@radix-ui/react-separator'
import ThemeToggle from './themeToggle'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const SidebarHeader = () => {
    const {state} = useSidebar()
  return (
      <header className=" bg-background/80 backdrop-blur-md border-b border-border">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
      <SidebarTrigger className="-ml-1" />
      <Logo show={state==="collapsed"}/>
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
  )
}

export default SidebarHeader
