import { categoryValue, oneOf, positivePrice, requiredText } from '@/lib/validation'

/** Tjänstens innehåll, så som det skapas och redigeras. */
export interface ServiceContent {
  title: string
  description: string
  price: number
  delivery_time: string
  category: string
  vat_included: boolean | null
}

/**
 * Validerar innehållet från formuläret. Samma regler när tjänsten skapas och
 * när den redigeras. Kastar InputValidationError med ett meddelande för
 * användaren.
 */
export function parseServiceContent(body: Record<string, unknown>): ServiceContent {
  return {
    title: requiredText(body.title, 'Titel', 3, 120),
    description: requiredText(body.description, 'Beskrivning', 10, 5000),
    price: positivePrice(body.price),
    delivery_time: requiredText(body.delivery_time, 'Leveranstid', 2, 120),
    category: categoryValue(body.category),
    vat_included: body.vat_included == null ? null : oneOf(String(body.vat_included), ['true', 'false'] as const, 'Moms') === 'true',
  }
}
