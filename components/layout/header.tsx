"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Menu, User, Heart, ShoppingBag, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const [searchType, setSearchType] = useState("jobs")
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const { style } = document.documentElement
      const prevOverflow = style.overflow
      const prevPaddingRight = style.paddingRight
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      style.overflow = "hidden"
      if (scrollBarWidth > 0) style.paddingRight = `${scrollBarWidth}px`
      return () => {
        style.overflow = prevOverflow
        style.paddingRight = prevPaddingRight
      }
    }
  }, [isOpen])

  const navigation = [
    { name: "Jobs", href: "/jobs" },
    { name: "Deals", href: "/deals" },
    { name: "Blog", href: "/blog" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Support", href: "/support" },
  ]

  // Inline style ensures a robust blur + saturation fallback (works better in Safari)
  const glassStyle = {
    backdropFilter: "saturate(150%) blur(8px)",
    WebkitBackdropFilter: "saturate(150%) blur(8px)",
  }

  return (
    <header
      style={glassStyle}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? ""
        : "bg-transparent"
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Outer pill that holds nav — it's the main glass card */}
        <div
          style={glassStyle}
          className={`transition-all duration-300 mx-0 ${isScrolled ? "my-2" : "my-4"
            } rounded-2xl bg-clip-padding bg-white/6 dark:bg-gray-900/30 backdrop-blur-md border border-white/10 dark:border-gray-800/30 shadow-sm`}
        >
          <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
            {/* Logo - Mobile First */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0 relative z-10">
  <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
    <Image
      src="/logo.png"
      alt="Logo"
      width={120}
      height={120}
      className="object-contain"
    />
  </div>
  <span className="text-lg sm:text-xl font-bold tracking-tighter hidden xs:block text-foreground">
    WIRsuchen
  </span>
</Link>


            {/* Mobile Search Toggle */}
            <div className="flex items-center space-x-2 sm:hidden">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200 relative z-10"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Search Bar - Hidden on mobile/tablet */}
            <div className="hidden xl:flex items-center space-x-2 flex-1 max-w-sm mx-6">
              <div className="relative flex-1">
                <div className="flex rounded-lg overflow-hidden border border-white/10 dark:border-gray-800/30 bg-transparent">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="w-20 border-0 bg-transparent text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/6 dark:bg-gray-900/30 backdrop-blur-md border border-white/10 dark:border-gray-800/30">
                      <SelectItem value="jobs">Jobs</SelectItem>
                      <SelectItem value="deals">Deals</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="search"
                    placeholder={`Search ${searchType}...`}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button size="sm" className="h-8 w-8 m-1 rounded-md" variant="ghost">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Actions - Mobile First */}
            <div className="flex items-center space-x-1">
              <Link href="/saved" className="hidden md:block">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-foreground hover:bg-accent hover:text-accent-foreground">
                  <Heart className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Saved</span>
                </Button>
              </Link>

              {user ? (
                <>
                  <Link href="/dashboard" className="hidden md:block">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-foreground hover:bg-accent hover:text-accent-foreground">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      <span className="hidden lg:inline">Dashboard</span>
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hidden md:flex h-8 px-2 text-foreground hover:bg-accent hover:text-accent-foreground">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:inline text-sm">{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white/6 dark:bg-gray-900/30 backdrop-blur-md border border-white/10 dark:border-gray-800/30">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile" className="text-foreground">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="text-foreground">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-foreground">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden md:block">
                    <Button variant="outline" size="sm" className="h-8 px-3 bg-transparent text-foreground border-white/10 dark:border-gray-800/30 hover:bg-accent hover:text-accent-foreground">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden lg:inline">Login</span>
                    </Button>
                  </Link>
                  <Link href="/register" className="hidden md:block">
                    <Button size="sm" className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90">
                      <span className="hidden lg:inline">Sign Up</span>
                      <span className="lg:hidden">Join</span>
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Open menu"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    className="md:hidden h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  style={glassStyle}
                  className="w-[86vw] max-w-[24rem] bg-background/90 backdrop-blur-xl border-l border-border/60 overflow-y-auto overscroll-contain focus:outline-none rounded-l-2xl"
                >
                  <div className="flex flex-col space-y-6 mt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-2">
                    {/* Mobile Search */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground/80">Search</h3>
                      <Select value={searchType} onValueChange={setSearchType}>
                        <SelectTrigger className="h-10 bg-card/90 border-border/60 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-md border border-border/60">
                          <SelectItem value="jobs">Jobs</SelectItem>
                          <SelectItem value="deals">Deals</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <Input
                          type="search"
                          placeholder={`Search ${searchType}...`}
                          className="h-10 pr-10 bg-card/90 border-border/60 text-foreground placeholder:text-foreground/60"
                        />
                        <Button size="sm" className="absolute right-1 top-1 h-8 w-8" variant="ghost">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground/80">Navigation</h3>
                      <nav className="flex flex-col space-y-1">
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-3 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors min-h-[44px]"
                            onClick={() => setIsOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    {/* Mobile Actions */}
                    <div className="space-y-3 pt-4 border-t border-border/60">
                      <Link href="/saved" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="justify-start w-full h-10 text-foreground hover:bg-accent hover:text-accent-foreground">
                          <Heart className="h-4 w-4 mr-3" />
                          Saved Items
                        </Button>
                      </Link>

                      {user ? (
                        <>
                          <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="justify-start w-full h-10 text-foreground hover:bg-accent hover:text-accent-foreground">
                              <ShoppingBag className="h-4 w-4 mr-3" />
                              Dashboard
                            </Button>
                          </Link>
                          <div className="flex items-center space-x-3 p-3 border border-border/60 rounded-lg bg-accent/10 backdrop-blur-sm">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="justify-start w-full h-10 bg-transparent text-foreground border-border/60 hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              logout()
                              setIsOpen(false)
                            }}
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Logout
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Link href="/login" onClick={() => setIsOpen(false)}>
                            <Button variant="outline" className="justify-start w-full h-10 bg-transparent text-foreground border-border/60 hover:bg-accent hover:text-accent-foreground">
                              <User className="h-4 w-4 mr-3" />
                              Login
                            </Button>
                          </Link>
                          <Link href="/register" onClick={() => setIsOpen(false)}>
                            <Button className="justify-start w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90">
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
