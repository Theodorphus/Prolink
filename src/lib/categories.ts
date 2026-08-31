export const CATEGORIES = [
  { value: 'webbutveckling', label: 'Webbutveckling', emoji: '⌘' },
  { value: 'design', label: 'Design & varumärke', emoji: '◐' },
  { value: 'marknadsforing', label: 'Digital marknadsföring', emoji: '↗' },
  { value: 'redovisning', label: 'Redovisning & ekonomi', emoji: '∑' },
  { value: 'text', label: 'Text & innehåll', emoji: '✎' },
  { value: 'foto-video', label: 'Foto & video', emoji: '◉' },
  { value: 'it-support', label: 'IT & teknisk support', emoji: '⚙' },
  { value: 'affarsstod', label: 'Administration & affärsstöd', emoji: '▦' },
  { value: 'annat', label: 'Annat', emoji: '✦' },
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
