import { Locale, defaultLocale } from './config'
import de from './locales/de.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import it from './locales/it.json'

// Translation dictionaries
const translations = {
  de,
  en,
  fr,
  it,
}

// Type for translation keys
type TranslationKeys = string

// Get nested value from object by dot notation path
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

// Main translation function
export function getTranslation(locale: Locale, key: TranslationKeys, fallback?: string): string {
  const dict = translations[locale] || translations[defaultLocale]
  const value = getNestedValue(dict, key)
  
  if (value && value !== key) {
    return value
  }
  
  // Fallback to default locale if translation not found
  if (locale !== defaultLocale) {
    const defaultDict = translations[defaultLocale]
    const defaultValue = getNestedValue(defaultDict, key)
    if (defaultValue && defaultValue !== key) {
      return defaultValue
    }
  }
  
  return fallback || key
}

// Short alias for translation function
export function t(locale: Locale, key: TranslationKeys, fallback?: string): string {
  return getTranslation(locale, key, fallback)
}

// Get all translations for a specific locale
export function getAllTranslations(locale: Locale) {
  return translations[locale] || translations[defaultLocale]
}

// Check if a translation key exists
export function hasTranslation(locale: Locale, key: TranslationKeys): boolean {
  const dict = translations[locale] || translations[defaultLocale]
  const value = getNestedValue(dict, key)
  return value !== key && value !== undefined
}

// Get translation with variables replacement
export function tr(
  locale: Locale,
  key: TranslationKeys,
  variables?: Record<string, string | number>
): string {
  let translation = getTranslation(locale, key)
  
  if (variables) {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      translation = translation.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(varValue))
    })
  }
  
  return translation
}

// Export translation dictionaries for server components
export { translations }
