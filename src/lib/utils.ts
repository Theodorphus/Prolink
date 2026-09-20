import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  // Ett ogiltigt värde renderade tidigare den synliga texten "NaN kr".
  if (!Number.isFinite(amount)) return ''
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount)
}

// Intl.DateTimeFormat.format() kastar RangeError på ett ogiltigt datum, vilket
// hade tagit ner hela sidan. Kolumnerna är visserligen not null i databasen,
// men funktionerna är exporterade och anropas på data från flera håll, så de
// får hellre returnera tom sträng än krascha renderingen.
function parseDate(date: string): Date | null {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(date: string): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(parsed)
}

export function formatDateTime(date: string): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
}

export function timeAgo(date: string): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000)
  if (seconds < 0) return 'just nu'
  if (seconds < 60) return 'just nu'
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min sedan`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return `${hours} tim sedan`
  }

  const days = Math.floor(seconds / 86400)
  if (days < 7) return `${days} dag${days > 1 ? 'ar' : ''} sedan`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} vecka${weeks > 1 ? 'r' : ''} sedan`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} månad${months > 1 ? 'er' : ''} sedan`
  }
  const years = Math.floor(days / 365)
  return `${years} år sedan`
}
