import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Inloggade ytor har inget värde i sökresultat och ska inte krypas.
      disallow: ['/messages', '/offers', '/api/', '/login', '/register'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
