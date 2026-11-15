import type { ReactNode } from 'react'
import { unstable_cache } from 'next/cache'
import Link from '@/components/i18n/Link'
import ServiceCard from '@/components/services/ServiceCard'
import { createPublicClient } from '@/lib/supabase/public'
import { FEATURED_SERVICE_COUNT, onePerProvider } from '@/lib/service-limits.mjs'
import { getLocale, getT } from '@/i18n/server'
import { translateListings } from '@/lib/content-translation'
import { withProviderTrust } from '@/lib/provider-trust'
import { PUBLIC_SERVICES_TAG } from '@/lib/revalidate'

// Startsidan ska visa bredden av frilansare, inte en enda persons katalog:
// den senaste tjänsten från var och en av de senast aktiva frilansarna. Ett
// större urval hämtas så att det räcker även när någon publicerat många i rad.
const featuredServices = unstable_cache(async () => {
  const { data, error } = await createPublicClient()
    .from('services')
    .select('*, provider:users!inner(id, name, avatar_url)')
    .eq('provider.role', 'provider')
    .order('created_at', { ascending: false })
    .order('id')
    .limit(100)
  if (error) throw new Error('Tjänsterna kunde inte hämtas.')
  return onePerProvider(data, FEATURED_SERVICE_COUNT)
}, ['public-featured-services-one-per-provider'], { revalidate: 60, tags: [PUBLIC_SERVICES_TAG] })

/** Gemensamt omslag, så att skelettet tar samma plats som den färdiga sektionen. */
function Section({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">{header}</div>
      {children}
    </section>
  )
}

/** Skelett som visas medan tjänsterna hämtas. Lika många kort som i rutnätet. */
export async function FeaturedServicesSkeleton() {
  const t = await getT()
  return (
    <Section header={<h2 className="page-heading text-2xl">{t('Tjänster att börja med')}</h2>}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: FEATURED_SERVICE_COUNT }, (_, i) => (
          <div key={i} className="surface flex flex-col gap-3 p-6">
            <div className="skeleton h-6 w-28 rounded-full" />
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
            <div className="mt-2 flex items-end justify-between">
              <div className="skeleton h-6 w-20 rounded" />
              <div className="skeleton h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default async function FeaturedServices() {
  const t = await getT()
  const locale = await getLocale()
  let data
  try { data = await featuredServices() }
  catch {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">
        {t('Tjänsterna kunde inte hämtas.')}{' '}
        <Link className="underline" href="/services">{t('Försök igen')}</Link>
      </p>
    )
  }
  if (!data?.length) return null
  const services = await withProviderTrust(await translateListings('service', data, locale))
  return (
    <Section
      header={<>
        <h2 className="page-heading text-2xl">{t('Tjänster att börja med')}</h2>
        <Link className="text-sm font-semibold underline" href="/services">{t('Alla tjänster')}</Link>
      </>}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(service => <ServiceCard key={service.id} service={service} />)}
      </div>
    </Section>
  )
}
