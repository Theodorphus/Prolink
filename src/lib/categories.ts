export const CATEGORIES = [
  { value: 'webbutveckling', label: 'Webbutveckling', emoji: '⌘' },
  { value: 'design', label: 'Design & varumärke', emoji: '◐' },
  { value: 'marknadsforing', label: 'Digital marknadsföring', emoji: '↗' },
  { value: 'redovisning', label: 'Ekonomi & redovisning', emoji: '∑' },
  { value: 'juridik', label: 'Juridik & avtal', emoji: '§' },
  { value: 'text', label: 'Text & översättning', emoji: '✎' },
  { value: 'foto-video', label: 'Foto, video & redigering', emoji: '◉' },
  { value: 'it-support', label: 'IT & teknisk support', emoji: '⚙' },
  { value: 'affarsstod', label: 'Administration & affärsstöd', emoji: '▦' },
  { value: 'annat', label: 'Annat', emoji: '✦' },
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

export function getCategoryEmoji(value: string | null | undefined): string {
  if (!value) return '✦'
  return CATEGORIES.find(category => category.value === value)?.emoji ?? '✦'
}
