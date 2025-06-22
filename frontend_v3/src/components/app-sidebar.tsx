import * as React from "react"
import { Brain, Search, Building2, BarChart3, Database, Settings, LogOut, TrendingUp, Target, Users } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"

// Company Intelligence Dashboard Navigation
const data = {
  navMain: [
    {
      title: "Intelligence",
      items: [
        {
          title: "Company Search",
          url: "/dashboard",
          icon: Search,
          isActive: true,
        },
        {
          title: "Database",
          url: "/dashboard/companies",
          icon: Database,
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Lead Generation",
      items: [
        {
          title: "Lead Scoring",
          url: "/dashboard/scoring",
          icon: Target,
        },
        {
          title: "Market Insights",
          url: "/dashboard/market",
          icon: TrendingUp,
        },
        {
          title: "Customer Profiles",
          url: "/dashboard/profiles",
          icon: Users,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Settings",
          url: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">LeadIntel</span>
            <span className="text-xs text-muted-foreground">Intelligence Platform</span>
          </div>
        </div>
        <div className="px-4 pb-2">
          <SearchForm />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((navItem) => (
                  <SidebarMenuItem key={navItem.title}>
                    <SidebarMenuButton asChild isActive={navItem.isActive} className="w-full">
                      <a href={navItem.url} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <navItem.icon className="w-4 h-4" />
                        <span className="font-medium">{navItem.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/login" className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
