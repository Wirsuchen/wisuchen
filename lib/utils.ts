import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a numeric value with thousands separators and suffix euro sign.
// Example: 2199 => "2,199 €"; 9.5 => "9.50 €"
export function formatEuro(value: number, opts?: { decimals?: number; space?: string }): string {
  const decimals = opts?.decimals ?? (Number.isInteger(value) ? 0 : 2)
  const space = opts?.space ?? " "
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
  return `${formatted}${space}€`
}

// Normalize any text that uses a prefixed euro symbol to a suffixed format.
// Examples:
//  "€2,199" -> "2,199 €"
//  "€100 - €200" -> "100 € - 200 €"
//  "Buy Now - €999" -> "Buy Now - 999 €"
export function formatEuroText(text?: string | number | null): string {
  if (text == null) return ""
  const s = String(text)
  // Move any leading euro before a number to after that number.
  // Handles ranges and repeated occurrences.
  return s.replace(/€\s?(\d[\d.,]*)/g, (_m, num: string) => `${num} €`)
}
