import { categoryValue, oneOf, optionalText, positivePrice, requiredText } from '@/lib/validation'

const WORK_TYPES = ['remote', 'onsite', 'hybrid'] as const

/** Uppdragets innehåll, så som det skapas och redigeras. */
export interface JobContent {
  title: string
  description: string
  category: string
  budget: number | null
  location: string | null
  work_type: string | null
}

/**
 * Validerar innehållet från formuläret. Samma regler när uppdraget skapas och
 * när det redigeras. Kastar InputValidationError med ett meddelande för
 * användaren.
 */
export function parseJobContent(body: Record<string, unknown>): JobContent {
  const workType = optionalText(body.work_type, 'Arbetsform', 30)
  return {
    title: requiredText(body.title, 'Titel', 3, 120),
    description: requiredText(body.description, 'Beskrivning', 10, 5000),
    category: categoryValue(body.category),
    budget: body.budget === undefined || body.budget === null || body.budget === '' ? null : positivePrice(body.budget, 'Budget'),
    location: optionalText(body.location, 'Plats', 120),
    work_type: workType ? oneOf(workType, WORK_TYPES, 'Arbetsform') : null,
  }
}
