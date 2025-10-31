"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Briefcase,
  ShoppingBag,
  FileText,
  BarChart3,
  User,
  Menu,
} from "lucide-react"

export function DashboardMobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Menu className="h-4 w-4 mr-2" />
          Dashboard Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Dashboard</SheetTitle>
        </SheetHeader>
        
        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 py-4 border-b">
            {user.avatar ? (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <nav className="mt-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      item.current
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="ml-3">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
