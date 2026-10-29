import { unstable_cache } from 'next/cache'
import Link from '@/components/i18n/Link'
import ServiceCard from '@/components/services/ServiceCard'
import { createPublicClient } from '@/lib/supabase/public'
import { FEATURED_SERVICE_COUNT, onePerProvider } from '@/lib/service-limits.mjs'
import { getLocale, getT } from '@/i18n/server'
import { translateListings } from '@/lib/content-translation'
import { withProviderTrust } from '@/lib/provider-trust'
// Startsidan ska visa bredden av frilansare, inte en enda persons katalog:
// den senaste tjänsten från var och en av de senast aktiva frilansarna. Ett
// större urval hämtas så att det räcker även när någon publicerat många i rad.
const featuredServices = unstable_cache(async () => {
  const { data, error } = await createPublicClient().from('services').select('*, provider:users!inner(id, name, avatar_url)').eq('provider.role', 'provider').order('created_at', { ascending: false }).order('id').limit(100)
  if (error) throw new Error('Tjänsterna kunde inte hämtas.')
  return onePerProvider(data, FEATURED_SERVICE_COUNT)
}, ['public-featured-services-one-per-provider'], { revalidate: 60 })
export default async function FeaturedServices() {
  const t = await getT()
  const locale = await getLocale()
  let data
  try { data = await featuredServices() }
  catch { return <p className="px-4 py-8 text-center">{t('Tjänsterna kunde inte hämtas.')} <Link className="underline" href="/services">{t('Försök igen')}</Link></p> }
  if (!data?.length) return null
  const services = await withProviderTrust(await translateListings('service', data, locale))
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="page-heading text-2xl">{t('Tjänster att börja med')}</h2><Link className="text-sm font-semibold underline" href="/services">{t('Alla tjänster')}</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map(service => <ServiceCard key={service.id} service={service} />)}</div></section>
}
