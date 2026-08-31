import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
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
