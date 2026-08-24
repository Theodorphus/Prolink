import { CATEGORIES } from '@/lib/categories'
import { isAttachmentPathForOffer } from '@/lib/marketplace-rules.mjs'

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InputValidationError'
  }
}

export function requiredText(
  value: unknown,
  label: string,
  minLength: number,
  maxLength: number
): string {
  if (typeof value !== 'string') {
    throw new InputValidationError(`${label} krävs.`)
  }

  const normalized = value.trim()
  if (normalized.length < minLength) {
    throw new InputValidationError(`${label} måste vara minst ${minLength} tecken.`)
  }
  if (normalized.length > maxLength) {
    throw new InputValidationError(`${label} får vara max ${maxLength} tecken.`)
  }
  return normalized
}

export function optionalText(value: unknown, label: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw new InputValidationError(`${label} har ogiltigt format.`)
  }
  const normalized = value.trim()
  if (!normalized) return null
  if (normalized.length > maxLength) {
    throw new InputValidationError(`${label} får vara max ${maxLength} tecken.`)
  }
  return normalized
}

export function positivePrice(value: unknown, label = 'Pris'): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 99_999_999.99) {
    throw new InputValidationError(`${label} måste vara ett positivt belopp.`)
  }
  return Math.round(parsed * 100) / 100
}

export function oneOf<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string
): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new InputValidationError(`${label} är ogiltig.`)
  }
  return value as T[number]
}

export function categoryValue(value: unknown): string {
  return oneOf(value, CATEGORIES.map(category => category.value), 'Kategori')
}

export function uuidValue(value: unknown, label: string): string {
  if (
    typeof value !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new InputValidationError(`${label} är ogiltigt.`)
  }
  return value
}

export function emailValue(value: unknown, label = 'E-post'): string {
  const email = requiredText(value, label, 3, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputValidationError(`${label} är ogiltig.`)
  }
  return email
}

export function optionalHttpUrl(value: unknown, label: string): string | null {
  const normalized = optionalText(value, label, 2048)
  if (!normalized) return null

  try {
    const url = new URL(normalized)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol')
    return url.toString()
  } catch {
    throw new InputValidationError(`${label} måste vara en giltig http- eller https-adress.`)
  }
}

export function attachmentPath(value: unknown, offerId: string): string | null {
  if (value === undefined || value === null || value === '') return null
  const path = requiredText(value, 'Bilaga', 1, 1024)
  if (!isAttachmentPathForOffer(path, offerId)) {
    throw new InputValidationError('Bilagans sökväg är ogiltig.')
  }
  return path
}

export function safeRelativePath(value: unknown, fallback = '/'): string {
  if (
    typeof value !== 'string'
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || value.includes('\0')
  ) {
    return fallback
  }
  return value
}
