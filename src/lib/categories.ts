export const CATEGORIES = [
  { value: 'stad',       label: 'Städ',       emoji: '🧹' },
  { value: 'cafe',       label: 'Café',        emoji: '☕' },
  { value: 'restaurang', label: 'Restaurang',  emoji: '🍽️' },
  { value: 'lager',      label: 'Lager',       emoji: '📦' },
  { value: 'butik',      label: 'Butik',       emoji: '🛍️' },
  { value: 'extrajobb',  label: 'Extrajobb',   emoji: '⚡' },
  { value: 'kontor',     label: 'Kontor',      emoji: '💼' },
  { value: 'transport',  label: 'Transport',   emoji: '🚗' },
  { value: 'vard',       label: 'Vård & omsorg', emoji: '❤️' },
  { value: 'annat',      label: 'Annat',       emoji: '✨' },
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']

export function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return 'Okategoriserad'
  return CATEGORIES.find(c => c.value === value)?.label ?? value
}

export function getCategoryEmoji(value: string | null | undefined): string {
  if (!value) return '✨'
  return CATEGORIES.find(c => c.value === value)?.emoji ?? '✨'
}
