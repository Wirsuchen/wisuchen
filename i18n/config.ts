// i18n Configuration for wirsuchen
// Supports: German (DE), English (EN), French (FR), Italian (IT)

export type Locale = 'de' | 'en' | 'fr' | 'it'

export const locales: Locale[] = ['de', 'en', 'fr', 'it']

export const defaultLocale: Locale = 'de' // German as default

export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
}

export const localeFlags: Record<Locale, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
}

// Check if a locale is valid
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// Get locale from pathname
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale
  }
  
  return null
}

// Remove locale from pathname
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname)
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/'
  }
  return pathname
}

// Add locale to pathname
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  const cleanPath = removeLocaleFromPathname(pathname)
  return `/${locale}${cleanPath}`
}
