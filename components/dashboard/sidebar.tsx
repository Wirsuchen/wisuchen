"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
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
  Shield,
  UserCheck,
  Gavel,
  ClipboardList,
  Megaphone,
  PenSquare,
  BarChart2,
  LogOut,
} from "lucide-react"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useTranslation } from "@/contexts/i18n-context"

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const role = (user as any)?.role
  const isAdmin = !!(user && ((['admin', 'supervisor', 'moderator'] as any).includes(role) || user.email === 'admin@wirsuchen.com'))
  const { t } = useTranslation()


  const navigation = [
    {
      name: t("dashboard.nav.overview"),
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: t("dashboard.nav.myAds"),
      href: "/dashboard/my-ads",
      icon: Briefcase,
      current: pathname === "/dashboard/my-ads",
    },
    {
      name: t("dashboard.nav.myDeals"),
      href: "/dashboard/my-deals",
      icon: ShoppingBag,
      current: pathname === "/dashboard/my-deals",
    },
    {
      name: t("dashboard.nav.myInvoices"),
      href: "/dashboard/my-invoices",
      icon: FileText,
      current: pathname === "/dashboard/my-invoices",
    },
    {
      name: t("dashboard.nav.stats"),
      href: "/dashboard/stats",
      icon: BarChart3,
      current: pathname === "/dashboard/stats",
    },
    {
      name: t("dashboard.nav.profile"),
      href: "/dashboard/profile",
      icon: User,
      current: pathname === "/dashboard/profile",
    },
  ]

  return (
    <div className={cn("bg-muted/50 border-r transition-all duration-300 h-screen sticky top-0", collapsed ? "w-16" : "w-64")}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && <h2 className="text-lg font-semibold">{t("dashboard.title")}</h2>}
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

                      </>
                    )}
                  </Link>
                </li>
              )
            })}
            {isAdmin && (
              <>
                <li>
                  <Link
                    href="/dashboard/blog"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/dashboard/blog" || pathname?.startsWith("/dashboard/blog/edit")
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <PenSquare className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-3">{t("dashboard.nav.manageBlogs")}</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/blog/create"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/dashboard/blog/create"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <PenSquare className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-3">{t("dashboard.nav.createBlog")}</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/admin"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-3">{t("dashboard.nav.admin")}</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/invoices/create"
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/admin/invoices/create"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="ml-3">{t("dashboard.createInvoice")}</span>}
                  </Link>
                </li>
              </>
            )}
            {role === 'supervisor' && (
              <li>
                <Link href="/supervisor" className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/supervisor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                  <UserCheck className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{t("dashboard.nav.supervisor")}</span>}
                </Link>
              </li>
            )}
            {role === 'moderator' && (
              <li>
                <Link href="/moderator" className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/moderator" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                  <Gavel className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{t("dashboard.nav.moderator")}</span>}
                </Link>
              </li>
            )}
            {role === 'lister' && (
              <li>
                <Link href="/lister" className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/lister" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{t("dashboard.nav.lister")}</span>}
                </Link>
              </li>
            )}
            {role === 'publisher' && (
              <li>
                <Link href="/publisher" className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/publisher" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                  <Megaphone className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{t("dashboard.nav.publisher")}</span>}
                </Link>
              </li>
            )}
            {role === 'blogger' && (
              <li>
                <Link href="/blogger" className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/blogger" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                  <PenSquare className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{t("dashboard.nav.blogger")}</span>}
                </Link>
              </li>
            )}
            {role === 'editor' && (
              <li>
                <Link href="/editor" className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/editor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                  <PenSquare className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{t("dashboard.nav.editor")}</span>}
                </Link>
              </li>
            )}
            {role === 'analyst' && (
              <li>
                <Link href="/analyst" className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/analyst" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}>
                  <BarChart2 className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="ml-3">{t("dashboard.nav.analyst")}</span>}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User Info */}
        {!collapsed && user && (
          <div className="p-4 border-t">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
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
                <Link href="/dashboard/profile">
                  <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    {t("dashboard.settings")}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 bg-transparent"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.logout")}
                </Button>
                <div className="mt-3">
                  <LanguageSwitcher variant="default" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
