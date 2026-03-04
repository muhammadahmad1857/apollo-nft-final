"use client"

import { ArrowUpRight, ChevronRight, Command, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  userRole
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    badgeCount?: number
    openExternally?: boolean
    items?: {
      title: string
      url: string
      openExternally?: boolean
    }[]
  }[],
    userRole:"ADMIN" | "USER" | "SUPER_ADMIN"

}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // If there are no sub-items → render as simple link
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <a
                    href={item.url}
                    target={item.openExternally ? "_blank" : undefined}
                    rel={item.openExternally ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.openExternally && <ArrowUpRight className="size-3.5" />}
                  </a>
                </SidebarMenuButton>
                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <SidebarMenuAction
                    showOnHover={false}
                    className="text-[10px] rounded-full min-w-5 h-5 px-1.5 bg-zinc-800 text-zinc-100 border border-zinc-700"
                  >
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </SidebarMenuAction>
                )}
              </SidebarMenuItem>
            )
          }

          // Otherwise → render collapsible menu
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a
                            href={subItem.url}
                            target={subItem.openExternally ? "_blank" : undefined}
                            rel={subItem.openExternally ? "noopener noreferrer" : undefined}
                          >
                            <span>{subItem.title}</span>
                            {subItem.openExternally && (
                              <ArrowUpRight className="size-3.5" />
                            )}
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
             {<SidebarMenuItem >
                <SidebarMenuButton tooltip={"Admin Dashboard"} asChild>
                  <a
                    href={"https://admin.apollonft.io"}
                    target={"_blank"}
                    rel={"noopener noreferrer"}
                    className="flex items-center gap-2"
                  >
                     <Command />
                    <span>{"Admin Dashboard"}</span>
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </SidebarMenuButton>
                
              </SidebarMenuItem>}
      </SidebarMenu>
    </SidebarGroup>
  )
}
