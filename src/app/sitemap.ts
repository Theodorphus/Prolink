import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/site'

// Uppdrag, tjänster och leverantörsprofiler är plattformens publika innehåll
// och det enda som rimligen kan hittas via sök. Kartan byggs därför dynamiskt
// från databasen i stället för att bara lista de statiska sidorna.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/jobs`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/services`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    const supabase = await createClient()
    const [jobs, services, providers] = await Promise.all([
      supabase.from('jobs').select('id, created_at').eq('status', 'open'),
      supabase.from('services').select('id, created_at'),
      supabase.from('users').select('id, created_at').eq('role', 'provider'),
    ])

    const toEntry = (prefix: string, priority: number) =>
      (row: { id: string; created_at: string | null }): MetadataRoute.Sitemap[number] => ({
        url: `${SITE_URL}${prefix}/${row.id}`,
        lastModified: row.created_at ? new Date(row.created_at) : undefined,
        changeFrequency: 'weekly',
        priority,
      })

    return [
      ...staticRoutes,
      ...(jobs.data ?? []).map(toEntry('/jobs', 0.8)),
      ...(services.data ?? []).map(toEntry('/services', 0.7)),
      ...(providers.data ?? []).map(toEntry('/profile', 0.6)),
    ]
  } catch {
    // Kartan får aldrig faila bygget eller svaret; de statiska sidorna räcker.
    return staticRoutes
  }
}
