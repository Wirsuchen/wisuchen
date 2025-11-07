'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'

interface LanguageSwitcherProps {
  currentLocale: Locale
  variant?: 'default' | 'ghost' | 'outline'
  showLabel?: boolean
}

export function LanguageSwitcher({ 
  currentLocale, 
  variant = 'ghost',
  showLabel = false 
}: LanguageSwitcherProps) {
  const router = useRouter()
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale || isChanging) return
    
    setIsChanging(true)
    
    // Store locale preference in localStorage and cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', newLocale)
      // Set cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000` // 1 year
    }
    
    // Reload page to apply new language
    router.refresh()
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span className="hidden sm:inline">
              {localeFlags[currentLocale]} {localeNames[currentLocale]}
            </span>
          )}
          {!showLabel && (
            <span>{localeFlags[currentLocale]}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
            disabled={isChanging}
          >
            <span className="mr-2">{localeFlags[locale]}</span>
            <span>{localeNames[locale]}</span>
            {currentLocale === locale && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
