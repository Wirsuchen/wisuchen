"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  PenSquare,
  Shield,
  Settings,
  LogOut,
  UserCheck,
  Gavel,
  ClipboardList,
  Megaphone,
  BarChart2,
} from "lucide-react"
import { useTranslation } from "@/contexts/i18n-context"

export function DashboardMobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const role = (user as any)?.role
  const isAdmin = !!(user && ((['admin','supervisor','moderator'] as any).includes(role) || user.email === 'admin@wirsuchen.com'))
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Menu className="h-4 w-4 mr-2" />
          {t("dashboard.nav.menuButton")}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("dashboard.title")}</SheetTitle>
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
        <nav className="mt-6 flex-1 overflow-y-auto">
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
                  </Link>
                </li>
              )
            })}
            {isAdmin && (
              <>
                <li>
                  <Link
                    href="/dashboard/blog"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      pathname === "/dashboard/blog" || pathname?.startsWith("/dashboard/blog/edit")
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <PenSquare className="h-5 w-5 shrink-0" />
                    <span className="ml-3">{t("dashboard.nav.manageBlogs")}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/blog/create"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      pathname === "/dashboard/blog/create"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <PenSquare className="h-5 w-5 shrink-0" />
                    <span className="ml-3">{t("dashboard.nav.createBlog")}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      pathname === "/admin"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Shield className="h-5 w-5 shrink-0" />
                    <span className="ml-3">{t("dashboard.nav.admin")}</span>
                  </Link>
                </li>
              </>
            )}
            {role === 'supervisor' && (
              <li>
                <Link
                  href="/supervisor"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === "/supervisor"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <UserCheck className="h-5 w-5 shrink-0" />
                  <span className="ml-3">{t("dashboard.nav.supervisor")}</span>
                </Link>
              </li>
            )}
            {role === 'moderator' && (
              <li>
                <Link
                  href="/moderator"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === "/moderator"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Gavel className="h-5 w-5 shrink-0" />
                  <span className="ml-3">{t("dashboard.nav.moderator")}</span>
                </Link>
              </li>
            )}
            {role === 'lister' && (
              <li>
                <Link
                  href="/lister"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === "/lister"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <ClipboardList className="h-5 w-5 shrink-0" />
                  <span className="ml-3">{t("dashboard.nav.lister")}</span>
                </Link>
              </li>
            )}
            {role === 'publisher' && (
              <li>
                <Link
                  href="/publisher"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === "/publisher"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Megaphone className="h-5 w-5 shrink-0" />
                  <span className="ml-3">{t("dashboard.nav.publisher")}</span>
                </Link>
              </li>
            )}
            {role === 'blogger' && (
              <li>
                <Link
                  href="/blogger"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === "/blogger"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <PenSquare className="h-5 w-5 shrink-0" />
                  <span className="ml-3">{t("dashboard.nav.blogger")}</span>
                </Link>
              </li>
            )}
            {role === 'editor' && (
              <li>
                <Link
                  href="/editor"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === "/editor"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <PenSquare className="h-5 w-5 shrink-0" />
                  <span className="ml-3">{t("dashboard.nav.editor")}</span>
                </Link>
              </li>
            )}
            {role === 'analyst' && (
              <li>
                <Link
                  href="/analyst"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === "/analyst"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <BarChart2 className="h-5 w-5 shrink-0" />
                  <span className="ml-3">{t("dashboard.nav.analyst")}</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User Actions */}
        {user && (
          <div className="mt-auto border-t pt-4 pb-4 px-4 space-y-2">
            <Link href="/dashboard/profile" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                <Settings className="h-4 w-4 mr-2" />
                {t("dashboard.settings")}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => {
                logout()
                setOpen(false)
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("nav.logout")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
