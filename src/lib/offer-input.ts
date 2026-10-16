import { oneOf, positivePrice, requiredText } from '@/lib/validation'
import { msg } from '@/i18n/msg.mjs'

const PRICE_TYPES = ['fixed', 'hourly'] as const

/** Offertens innehåll, så som det skickas och redigeras. */
export interface OfferContent {
  price: number
  price_type: 'fixed' | 'hourly'
  timeline: string
  description: string
}

/**
 * Validerar innehållet från formuläret. Samma regler när offerten skickas och
 * när den redigeras. Kastar InputValidationError med ett meddelande för
 * användaren.
 */
export function parseOfferContent(body: Record<string, unknown>): OfferContent {
  return {
    price: positivePrice(body.price),
    price_type: oneOf(body.price_type, PRICE_TYPES, msg('Pristyp')),
    timeline: requiredText(body.timeline, msg('Tidsestimat'), 2, 120),
    description: requiredText(body.description, msg('Offertbeskrivning'), 10, 5000),
  }
}
