"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  name: string
  company?: string
  role?: string
  avatar?: string
  isSubscribed?: boolean
  plan?: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  login: (user: User) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check for active Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setSupabaseUser(session.user)
          try {
            const res = await fetch('/api/me', { cache: 'no-store' })
            if (res.ok) {
              const me = await res.json()
              setUser({
                id: me.id || session.user.id,
                email: me.email || session.user.email || '',
                name: me.name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || undefined,
                role: me.role || session.user.user_metadata?.role || 'user',
                company: session.user.user_metadata?.company || undefined,
                isSubscribed: !!me.is_subscribed,
                plan: me.plan || 'free',
              })
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || undefined,
                role: session.user.user_metadata?.role || 'user',
                company: session.user.user_metadata?.company || undefined,
                isSubscribed: false,
                plan: 'free',
              })
            }
          } catch {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || undefined,
              role: session.user.user_metadata?.role || 'user',
              company: session.user.user_metadata?.company || undefined,
              isSubscribed: false,
              plan: 'free',
            })
          }
        } else {
          setUser(null)
          setSupabaseUser(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        try {
          const res = await fetch('/api/me', { cache: 'no-store' })
          if (res.ok) {
            const me = await res.json()
            setUser({
              id: me.id || session.user.id,
              email: me.email || session.user.email || '',
              name: me.name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || undefined,
              role: me.role || session.user.user_metadata?.role || 'user',
              company: session.user.user_metadata?.company || undefined,
              isSubscribed: !!me.is_subscribed,
              plan: me.plan || 'free',
            })
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || undefined,
              role: session.user.user_metadata?.role || 'user',
              company: session.user.user_metadata?.company || undefined,
              isSubscribed: false,
              plan: 'free',
            })
          }
        } catch {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || undefined,
            role: session.user.user_metadata?.role || 'user',
            company: session.user.user_metadata?.company || undefined,
            isSubscribed: false,
            plan: 'free',
          })
        }
      } else {
        setUser(null)
        setSupabaseUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const login = async (userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return <AuthContext.Provider value={{ user, supabaseUser, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
