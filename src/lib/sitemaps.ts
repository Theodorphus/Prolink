import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { SITE_URL } from '@/lib/site'
const SHARD = 9000
const tables = ['jobs', 'services', 'users'] as const
function rows(table: typeof tables[number], head = false) {
  let query = createPublicClient().from(table).select('id, created_at', { count: 'exact', head })
  if (table === 'jobs') query = query.eq('status', 'open').is('archived_at', null).is('requested_provider_id', null)
  if (table === 'users') query = query.eq('role', 'provider')
  return query.order('id')
}
export async function generateSitemaps() {
  const counts = await Promise.all(tables.map(table => rows(table, true)))
  if (counts.some(result => result.error)) throw new Error('Sitemap count unavailable')
  return Array.from({ length: Math.max(1, ...counts.map(result => Math.ceil((result.count ?? 0) / SHARD))) }, (_, id) => ({ id }))
}
export async function sitemapEntries(id: string): Promise<MetadataRoute.Sitemap> {
  const shard = Number(id)
  if (!Number.isSafeInteger(shard) || shard < 0) return []
  const entries: MetadataRoute.Sitemap = shard === 0 ? ['', '/jobs', '/services', '/faq', '/terms', '/privacy'].map(path => ({ url: SITE_URL + path })) : []
  for (const table of tables) {
    // Fetch <= 500 rows per call, below Supabase's usual server row cap.
    for (let offset = shard * SHARD; offset < (shard + 1) * SHARD; offset += 500) {
      const { data, error } = await rows(table).range(offset, offset + 499)
      if (error) throw new Error('Sitemap unavailable')
      for (const row of data ?? []) entries.push({ url: `${SITE_URL}/${table === 'users' ? 'profile' : table}/${row.id}`, lastModified: row.created_at ? new Date(row.created_at) : undefined })
      if ((data?.length ?? 0) < 500) break
    }
  }
  return entries
}
