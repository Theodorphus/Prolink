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
  if (seconds < 60) return 'just nu'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min sedan`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} tim sedan`
  return `${Math.floor(seconds / 86400)} dag${Math.floor(seconds / 86400) > 1 ? 'ar' : ''} sedan`
}
