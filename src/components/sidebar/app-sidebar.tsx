"use client"

import * as React from "react"
import {
  AudioWaveform,
  Bot,
  ChartAreaIcon,
  Command,
  Files,
  GalleryVerticalEnd,
  LayoutDashboard,
  
  ShoppingCart,
  User,
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
import { useUser } from "@/hooks/useUser"
import { toast } from "sonner"
import { useAccount } from "wagmi"

// This is sample data.
const data = {
 user:{
    name: "Loading",
    avatarUrl:"",
    address: "0x1234...abcd",
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
      url: "/marketplace",
      icon: ShoppingCart,
      
    },
     {
      title: "Auction History",
      url: "/auction-activity",
      icon: ChartAreaIcon,
      
    },
    {
      title: "User Settings",
      url: "/dashboard/user",
      icon: User,
     items: [
       
        {
          title: "Edit profile",
          url: "/dashboard/edit-profile",
        },
       
      ],
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {address} = useAccount()
  const { data: user, isLoading, error } = useUser(address||"");
  const [navUser, setNavUser] = React.useState<{ name: string; avatarUrl: string; address: string } | null>(null);

  React.useEffect(() => {
    console.log("User data:", user, isLoading, error);
    if (error && !isLoading) {
      toast.error("Error fetching user data: " + error.message);
      console.log("User data: in condition 1", user, isLoading, error);
    }
    if (!user && !isLoading) {
      console.log("User data: in condition 2", user, isLoading, error);
      toast.error("User not found. Please complete your profile.");
      setNavUser(null);
    }
    if (user && !isLoading) {
      console.log("User data: in condition 3", user, isLoading, error);
      setNavUser({ name: user.name, avatarUrl: user.avatarUrl||"", address: user.walletAddress });
    }
  }, [user, isLoading, error]);

  const { state } = useSidebar();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={"Toggle sidebar"} asChild>
            <SidebarTrigger className={`-ml-1 ${state === "expanded" ? "hidden" : "block"}`} />
          </SidebarMenuButton>
        </SidebarMenuItem>
        <Logo show={state === "expanded"} width={150} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            navUser
              ? { name: navUser.name, address: navUser.address, avatar: navUser.avatarUrl }
              : { name: "Guest", address: "", avatar: "" }
          }
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
