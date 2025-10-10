"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  company: string
  role: string
  avatar: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("wirsuchen_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (userData: User) => {
    setUser(userData)
    localStorage.setItem("wirsuchen_user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("wirsuchen_user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
