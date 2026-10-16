import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DEFAULT_LOCALE, intlLocale, type Locale } from '@/i18n/config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale: Locale = DEFAULT_LOCALE): string {
  // Ett ogiltigt värde renderade tidigare den synliga texten "NaN kr".
  if (!Number.isFinite(amount)) return ''
  return new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount)
}

// Intl.DateTimeFormat.format() kastar RangeError på ett ogiltigt datum, vilket
// hade tagit ner hela sidan. Kolumnerna är visserligen not null i databasen,
// men funktionerna är exporterade och anropas på data från flera håll, så de
// får hellre returnera tom sträng än krascha renderingen.
function parseDate(date: string): Date | null {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium' }).format(parsed)
}

export function formatDateTime(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
}

export function timeAgo(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  const english = locale === 'en'
  const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000)
  if (seconds < 60) return english ? 'just now' : 'just nu'
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return english ? `${minutes} min ago` : `${minutes} min sedan`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return english ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ago` : `${hours} tim sedan`
  }

  const days = Math.floor(seconds / 86400)
  if (days < 7) return english ? `${days} ${days === 1 ? 'day' : 'days'} ago` : `${days} dag${days > 1 ? 'ar' : ''} sedan`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return english ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago` : `${weeks} vecka${weeks > 1 ? 'r' : ''} sedan`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return english ? `${months} ${months === 1 ? 'month' : 'months'} ago` : `${months} månad${months > 1 ? 'er' : ''} sedan`
  }
  const years = Math.floor(days / 365)
  return english ? `${years} ${years === 1 ? 'year' : 'years'} ago` : `${years} år sedan`
}
