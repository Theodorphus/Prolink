export const CATEGORIES = [
  { value: 'webbutveckling', label: 'Webbutveckling' },
  { value: 'design', label: 'Design & varumärke' },
  { value: 'marknadsforing', label: 'Digital marknadsföring' },
  { value: 'redovisning', label: 'Ekonomi & redovisning' },
  { value: 'juridik', label: 'Juridik & avtal' },
  { value: 'text', label: 'Text & översättning' },
  { value: 'foto-video', label: 'Foto, video & redigering' },
  { value: 'it-support', label: 'IT & teknisk support' },
  { value: 'affarsstod', label: 'Administration & affärsstöd' },
  { value: 'annat', label: 'Annat' },
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

export function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return 'Okategoriserad'
  return CATEGORIES.find(category => category.value === value)?.label ?? value
}

/** Bilden i public/categories. Okända och saknade kategorier får Annat. */
export function getCategoryImage(value: string | null | undefined): string {
  const known = CATEGORIES.some(category => category.value === value)
  return `/categories/${known ? value : 'annat'}.webp`
}
