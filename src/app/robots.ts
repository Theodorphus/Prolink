import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
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
