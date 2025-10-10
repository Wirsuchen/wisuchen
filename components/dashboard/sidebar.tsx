"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Briefcase,
  ShoppingBag,
  FileText,
  BarChart3,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "My Ads",
      href: "/dashboard/my-ads",
      icon: Briefcase,
      current: pathname === "/dashboard/my-ads",
      badge: "3",
    },
    {
      name: "My Deals",
      href: "/dashboard/my-deals",
      icon: ShoppingBag,
      current: pathname === "/dashboard/my-deals",
      badge: "12",
    },
    {
      name: "My Invoices",
      href: "/dashboard/my-invoices",
      icon: FileText,
      current: pathname === "/dashboard/my-invoices",
    },
    {
      name: "Stats",
      href: "/dashboard/stats",
      icon: BarChart3,
      current: pathname === "/dashboard/stats",
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      current: pathname === "/dashboard/profile",
    },
  ]

  return (
    <div className={cn("bg-muted/50 border-r transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && <h2 className="text-lg font-semibold">Dashboard</h2>}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      item.current
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="ml-3">{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-t">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    JD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">John Doe</p>
                    <p className="text-xs text-muted-foreground truncate">john@example.com</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
