import 'server-only'

import Stripe from 'stripe'

// Betalningar är valfria: saknas nycklarna döljs all Premium-text i
// gränssnittet och rutterna svarar 503, så att sajten fungerar som förut.
export function premiumConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PREMIUM_PRICE_ID)
}

let client: Stripe | null = null
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured')
  return (client ??= new Stripe(process.env.STRIPE_SECRET_KEY))
}
