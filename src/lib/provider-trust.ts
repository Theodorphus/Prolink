import { createPublicClient } from '@/lib/supabase/public'

interface WithProvider {
  provider?: { id?: string } | null
}

/**
 * Lägger verifierat företag och antal referenser på varje tjänsts leverantör
 * med ett enda anrop för hela listan. Märkena är en bonus på korten: om
 * hämtningen misslyckas visas korten utan dem i stället för att sidan fallerar.
 */
export async function withProviderTrust<T extends WithProvider>(services: T[]): Promise<T[]> {
  const ids = [...new Set(services.flatMap(service => service.provider?.id ?? []))]
  if (ids.length === 0) return services

  const { data, error } = await createPublicClient().rpc('provider_trust_summary', { p_user_ids: ids })
  if (error || !data) return services

  const trust = new Map(
    (data as { user_id: string; verified: boolean; reference_count: number }[]).map(row => [row.user_id, row]),
  )
  return services.map(service => {
    const row = service.provider?.id ? trust.get(service.provider.id) : undefined
    if (!row || !service.provider) return service
    return { ...service, provider: { ...service.provider, verified: row.verified, reference_count: row.reference_count } }
  })
}
