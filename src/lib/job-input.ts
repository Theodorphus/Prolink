import { categoryValue, oneOf, optionalText, positivePrice, requiredText } from '@/lib/validation'
import { msg } from '@/i18n/msg.mjs'

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
  const workType = optionalText(body.work_type, msg('Arbetsform'), 30)
  return {
    title: requiredText(body.title, msg('Titel'), 3, 120),
    description: requiredText(body.description, msg('Beskrivning'), 10, 5000),
    category: categoryValue(body.category),
    budget: body.budget === undefined || body.budget === null || body.budget === '' ? null : positivePrice(body.budget, msg('Budget')),
    location: optionalText(body.location, msg('Plats'), 120),
    work_type: workType ? oneOf(workType, WORK_TYPES, msg('Arbetsform')) : null,
  }
}
