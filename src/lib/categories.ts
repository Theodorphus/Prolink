import { msg } from '@/i18n/msg.mjs'
import type { TFunction } from '@/i18n/translate'

export const CATEGORIES = [
  { value: 'webbutveckling', label: msg('Webbutveckling') },
  { value: 'design', label: msg('Design & varumärke') },
  { value: 'marknadsforing', label: msg('Digital marknadsföring') },
  { value: 'redovisning', label: msg('Ekonomi & redovisning') },
  { value: 'juridik', label: msg('Juridik & avtal') },
  { value: 'text', label: msg('Text & översättning') },
  { value: 'foto-video', label: msg('Foto, video & redigering') },
  { value: 'it-support', label: msg('IT & teknisk support') },
  { value: 'affarsstod', label: msg('Administration & affärsstöd') },
  { value: 'annat', label: msg('Annat') },
] as const

// Kategorierna som lyfts först på mobil. Urvalet speglar de tjänster som
// oftast köps in av småföretag och som levereras helt på distans.
export const PRIORITY_CATEGORIES = [
  'webbutveckling',
  'design',
  'marknadsforing',
  'redovisning',
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']

/** Kategorierna med etiketterna översatta till sidans språk. */
export function localizedCategories(t: TFunction) {
  return CATEGORIES.map(category => ({ value: category.value, label: t(category.label) }))
}

export function getCategoryLabel(value: string | null | undefined, t?: TFunction): string {
  const translate: TFunction = t ?? (text => text)
  if (!value) return translate(msg('Okategoriserad'))
  const label = CATEGORIES.find(category => category.value === value)?.label
  return label ? translate(label) : value
}

/** Bilden i public/categories. Okända och saknade kategorier får Annat. */
export function getCategoryImage(value: string | null | undefined): string {
  const known = CATEGORIES.some(category => category.value === value)
  return `/categories/${known ? value : 'annat'}.webp`
}
