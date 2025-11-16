'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { Locale, defaultLocale, isValidLocale } from '@/i18n/config'
import { getTranslation, tr } from '@/i18n/utils'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
  tr: (key: string, variables?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

// Get locale from localStorage or cookie
function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  
  // Try localStorage first
  const stored = localStorage.getItem('preferredLocale')
  if (stored && isValidLocale(stored)) {
    return stored as Locale
  }
  
  // Try cookie
  if (typeof document !== 'undefined') {
  const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
  if (cookieMatch && isValidLocale(cookieMatch[1])) {
    return cookieMatch[1] as Locale
    }
  }
  
  return defaultLocale
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  
  useEffect(() => {
    // Get stored locale on mount
    const storedLocale = getStoredLocale()
    setLocale(storedLocale)
  }, [])

  const setLocaleHandler = (newLocale: Locale) => {
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', newLocale)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    }
  }

  const value: I18nContextType = {
    locale,
    setLocale: setLocaleHandler,
    t: (key: string, fallback?: string) => getTranslation(locale, key, fallback),
    tr: (key: string, variables?: Record<string, string | number>) => tr(locale, key, variables),
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    // Fallback if provider is missing
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key: string, fallback?: string) => getTranslation(defaultLocale, key, fallback),
      tr: (key: string, variables?: Record<string, string | number>) => tr(defaultLocale, key, variables),
    }
  }
  return context
}

// Convenience hook for just the translation function
export function useTranslation() {
  const { t, tr } = useI18n()
  return { t, tr }
}

// Convenience hook for just the locale
export function useLocale() {
  const { locale } = useI18n()
  return locale
}
