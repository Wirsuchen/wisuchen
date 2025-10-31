"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
