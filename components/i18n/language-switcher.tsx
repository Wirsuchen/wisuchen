'use client'

import { useState } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { Locale, locales, localeNames, localeFlagUrls } from '@/i18n/config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import Image from 'next/image'

// Flag component that uses images (works on all platforms including Windows)
function FlagIcon({ locale, size = 16 }: { locale: Locale; size?: number }) {
  return (
    <Image
      src={localeFlagUrls[locale]}
      alt={localeNames[locale]}
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block rounded-sm object-cover"
      unoptimized // Use CDN directly
    />
  )
}

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
}

export function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)

    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', newLocale)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    }

    // window.location.reload()
  }

  if (variant === 'icon-only') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
            aria-label={t('common.changeLanguage')}
          >
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-md border border-border/60">
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`cursor-pointer ${locale === loc ? 'bg-accent' : ''}`}
            >
              <span className="mr-2"><FlagIcon locale={loc} /></span>
              <span>{localeNames[loc]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 text-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
          >
            <span className="mr-1.5"><FlagIcon locale={locale} size={18} /></span>
            <span className="text-xs uppercase">{locale}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-md border border-border/60">
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`cursor-pointer ${locale === loc ? 'bg-accent' : ''}`}
            >
              <span className="mr-2"><FlagIcon locale={loc} /></span>
              <span>{localeNames[loc]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-3 text-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="mr-1.5"><FlagIcon locale={locale} size={18} /></span>
          <span className="hidden lg:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-md border border-border/60">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`cursor-pointer ${locale === loc ? 'bg-accent' : ''}`}
          >
            <span className="mr-2"><FlagIcon locale={loc} /></span>
            <span>{localeNames[loc]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
