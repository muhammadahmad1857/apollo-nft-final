"use client"

import * as React from "react"
import {
  AudioWaveform,
  Bot,
  Command,
  Files,
  GalleryVerticalEnd,
  LayoutDashboard,
  
  ShoppingCart,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import Logo from "../Logo"

// This is sample data.
const data = {
  user: {
    name: "Wizard of Oz",
    address: "0xGFC...6578",
    avatar: "/artist-1.png",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      // items: [
      //   {
      //     title: "History",
      //     url: "#",
      //   },
      //   {
      //     title: "Starred",
      //     url: "#",
      //   },
      //   {
      //     title: "Settings",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Mint NFT",
      url: "/dashboard/mint-single-nft",
      icon: Bot,
      items: [
        {
          title: "Mint Single NFT",
          url: "/dashboard/mint-single-nft",
        },
        {
          title: "Batch Minting",
          url: "/dashboard/batch-mint-nft",
        },
       
      ],
    },

    {
      title: "Files",
      url: "/dashboard/files",
      icon: Files,
     items: [
        {
          title: "Create New",
          url: "/dashboard/create",
        },
        {
          title: "View Existing",
          url: "/dashboard/files",
        },
       
      ],
    },
    {
      title: "MarketPlace",
      url: "/dashboard/marketplace",
      icon: ShoppingCart,
      
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {state} = useSidebar()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <SidebarMenuItem>
                <SidebarMenuButton tooltip={"Toggle sidebar"} asChild>
                
              <SidebarTrigger className={`-ml-1 ${state === "expanded" ? "hidden" : "block"}`} />
                </SidebarMenuButton>
              </SidebarMenuItem>
        <Logo show={state === "expanded"} width={150}/>

      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
