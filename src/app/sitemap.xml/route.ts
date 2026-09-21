import { generateSitemaps } from '@/lib/sitemaps'
import { SITE_URL } from '@/lib/site'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const shards = await generateSitemaps()
    const origin = SITE_URL.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${shards.map(({ id }) => `<sitemap><loc>${origin}/sitemaps/${id}</loc></sitemap>`).join('')}</sitemapindex>`, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } })
  } catch { return new Response('Sitemap temporarily unavailable', { status: 503 }) }
}
