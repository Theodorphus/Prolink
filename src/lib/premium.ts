import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { premiumConfigured, getStripe } from '@/lib/stripe'

// Håller URL:en kort även när urvalet innehåller hundratals frilansare.
const CHUNK = 100

/**
 * Vilka av frilansarna som har Premium. Vid fel returneras en tom mängd, så
 * att listan visas som för alla andra i stället för att sidan fallerar.
 */
export async function premiumProviderIds(ids: string[]): Promise<Set<string>> {
  const premium = new Set<string>()
  if (!premiumConfigured() || ids.length === 0) return premium
  const supabase = createPublicClient()
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK))
  const results = await Promise.all(chunks.map(chunk => supabase.rpc('premium_user_ids', { p_user_ids: chunk })))
  for (const { data, error } of results) {
    if (error || !data) continue
    for (const id of data as string[]) premium.add(id)
  }
  return premium
}

/** Månadspriset i kronor från Stripe, cachat. Null om det inte kan hämtas. */
export const premiumPrice = unstable_cache(async (): Promise<{ amount: number; currency: string } | null> => {
  try {
    const price = await getStripe().prices.retrieve(process.env.STRIPE_PREMIUM_PRICE_ID!)
    return price.unit_amount == null ? null : { amount: price.unit_amount / 100, currency: price.currency.toUpperCase() }
  } catch {
    return null
  }
}, ['premium-price'], { revalidate: 3600 })

/** Samma regel som premium_user_ids i databasen, för en rad vi redan har hämtat. */
export function subscriptionActive(subscription: { status: string; current_period_end: string | null } | null): boolean {
  return Boolean(subscription && ['active', 'trialing'].includes(subscription.status) && subscription.current_period_end && Date.parse(subscription.current_period_end) > Date.now())
}
