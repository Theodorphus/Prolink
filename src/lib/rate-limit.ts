import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Hastighetsbegränsning för skrivande endpoints.
 *
 * Räknaren ligger i databasen (migration 013). Applikationen kör serverlöst, så
 * en minnesbaserad räknare hade begränsat per instans i stället för per
 * användare, vilket i praktiken inte begränsar någonting.
 *
 * Gränserna är satta för att stoppa slingor och spam, inte för att hindra
 * normal användning. Ett verkligt konto når dem inte.
 */
export const RATE_LIMITS = {
  'jobs:create': { limit: 10, windowSeconds: 3600 },
  'offers:create': { limit: 20, windowSeconds: 3600 },
  'services:create': { limit: 10, windowSeconds: 3600 },
  'messages:send': { limit: 60, windowSeconds: 300 },
  'reviews:create': { limit: 10, windowSeconds: 3600 },
} as const

export type RateLimitedAction = keyof typeof RATE_LIMITS

/**
 * Registrerar ett försök och svarar om det ryms inom kvoten.
 *
 * Vid databasfel släpps anropet igenom. Ett trasigt begränsningssystem ska inte
 * göra produkten oanvändbar, och de skrivande rutterna har redan både
 * autentisering och RLS bakom sig. Felet loggas så att det inte tystnar.
 */
export async function withinRateLimit(
  supabase: SupabaseClient,
  action: RateLimitedAction
): Promise<boolean> {
  const { limit, windowSeconds } = RATE_LIMITS[action]

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error(`rate limit check failed for ${action}:`, error)
    return true
  }

  return data !== false
}

/** Standardsvar när kvoten är slut. */
export function rateLimitMessage(action: RateLimitedAction): string {
  const { windowSeconds } = RATE_LIMITS[action]
  const minutes = Math.round(windowSeconds / 60)
  return minutes >= 60
    ? 'Du har gjort det här för många gånger den senaste timmen. Försök igen senare.'
    : `Du har gjort det här för många gånger. Vänta några minuter och försök igen.`
}
