import { createPublicClient } from '@/lib/supabase/public'

interface WithProvider {
  provider?: { id?: string } | null
}

export interface ProviderTrust {
  user_id: string
  verified: boolean
  reference_count: number
  review_count?: number
  average_rating?: number | null
}

// Håller URL:en kort även när urvalet innehåller hundratals frilansare.
const CHUNK = 100

/**
 * Verifierat företag och antal referenser per frilansare, hundra åt
 * gången. Vid fel returneras en tom karta, så att korten visas utan märken.
 */
export async function providerTrustMap(ids: string[]): Promise<Map<string, ProviderTrust>> {
  const supabase = createPublicClient()
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK))
  const results = await Promise.all(chunks.map(chunk => Promise.all([
    supabase.rpc('provider_trust_summary', { p_user_ids: chunk }),
    supabase.rpc('provider_review_summary', { p_user_ids: chunk }),
  ])))
  const map = new Map<string, ProviderTrust>()
  for (const [trust] of results) {
    if (trust.error || !trust.data) continue
    for (const row of trust.data as ProviderTrust[]) map.set(row.user_id, row)
  }
  // Betygen är en bonus: saknas de visas kortet som förut.
  for (const [, reviews] of results) {
    if (reviews.error || !reviews.data) continue
    for (const row of reviews.data as { user_id: string; review_count: number; average_rating: number | string | null }[]) {
      const entry = map.get(row.user_id)
      if (entry) {
        entry.review_count = row.review_count
        entry.average_rating = row.average_rating == null ? null : Number(row.average_rating)
      }
    }
  }
  return map
}

/**
 * Lägger verifierat företag och antal referenser på varje tjänsts leverantör
 * med ett enda anrop för hela listan. Märkena är en bonus på korten: om
 * hämtningen misslyckas visas korten utan dem i stället för att sidan fallerar.
 */
export async function withProviderTrust<T extends WithProvider>(services: T[]): Promise<T[]> {
  const ids = [...new Set(services.flatMap(service => service.provider?.id ?? []))]
  if (ids.length === 0) return services

  const trust = await providerTrustMap(ids)
  return services.map(service => {
    const row = service.provider?.id ? trust.get(service.provider.id) : undefined
    if (!row || !service.provider) return service
    return { ...service, provider: { ...service.provider, verified: row.verified, reference_count: row.reference_count, review_count: row.review_count, average_rating: row.average_rating } }
  })
}
