"use client"

import * as React from "react"
import {
  AudioWaveform,
  Bell,
  Bot,
  ChartAreaIcon,
  Command,
  GalleryVerticalEnd,
  Heart,
  LayoutDashboard,
  ListMusic,
  Archive,
  ShoppingCart,
  User,
  type LucideIcon,
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
import { useUnreadNotificationsCount } from "@/hooks/useNotifications"
import { toast } from "sonner"
import { useAccount } from "wagmi"

type NavSubItem = {
  title: string;
  url: string;
  openExternally?: boolean;
};

type NavMainItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
  openExternally?: boolean;
};

type SidebarData = {
  user: {
    name: string;
    avatarUrl: string;
    address: string;
  };
  teams: {
    name: string;
    logo: LucideIcon;
    plan: string;
  }[];
  navMain: NavMainItem[];
};

// This is sample data.
const data: SidebarData = {
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
      url: "/dashboard/mint",
      icon: Bot,
      items: [
        {
          title: "Mint Single NFT",
          url: "/dashboard/mint",
        },
        {
          title: "Batch Minting",
          url: "/dashboard/batch-mint",
        },
       
      ],
    },

    // {
    //   title: "Files",
    //   url: "/dashboard/files",
    //   icon: Files,
    //  items: [
    //     {
    //       title: "Create New",
    //       url: "/dashboard/create",
    //     },
    //     {
    //       title: "View Existing",
    //       url: "/dashboard/files",
    //     },
       
    //   ],
    // },
    {
      title: "MarketPlace",
      url: "/marketplace",
      icon: ShoppingCart,
      
    },
     {
      title: "Auction History",
      url: "/dashboard/auction-activity",
      icon: ChartAreaIcon,
      
    },
    {
      title: "My Favorites",
      url: "/dashboard/favorites",
      icon: Heart,
      
    },
    {
      title: "Archived NFTs",
      url: "/dashboard/archived",
      icon: Archive,
      
    },
    {
      title: "Playlists",
      url: "/dashboard/playlist",
      icon: ListMusic,
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
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
  const normalizedWallet = address?.toLowerCase() || "";
  const { data: unreadCountData } = useUnreadNotificationsCount({
    wallet: normalizedWallet,
  });
  const unreadCount = unreadCountData?.unread ?? 0;
  const [navUser, setNavUser] = React.useState<{ name: string; avatarUrl: string; address: string } | null>(null);

  const navItems = React.useMemo(
    () =>
      data.navMain.map((item) => {
        if (item.url !== "/dashboard/notifications") {
          return item;
        }
        return {
          ...item,
          badgeCount: unreadCount,
        };
      }),
    [unreadCount]
  );

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
    <Sidebar collapsible="icon" {...props} className="bg-background/20 backdrop-blur-lg border-r-2">
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
        <NavMain items={navItems} userRole={user?.role ||"USER"}/>
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          unreadCount={unreadCount}
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
