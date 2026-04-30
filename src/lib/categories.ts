export const CATEGORIES = [
  { value: 'it',           label: 'IT & Utveckling' },
  { value: 'design',       label: 'Design & Grafik' },
  { value: 'ekonomi',      label: 'Ekonomi & Finans' },
  { value: 'marknadsforing', label: 'Marknadsföring' },
  { value: 'text',         label: 'Text & Översättning' },
  { value: 'juridik',      label: 'Juridik' },
  { value: 'foto',         label: 'Foto & Video' },
  { value: 'bygg',         label: 'Bygg & Hantverk' },
  { value: 'utbildning',   label: 'Utbildning & Coaching' },
  { value: 'annat',        label: 'Annat' },
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']

export function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return 'Okategoriserad'
  return CATEGORIES.find(c => c.value === value)?.label ?? value
}
