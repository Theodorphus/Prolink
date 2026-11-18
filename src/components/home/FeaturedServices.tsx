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

// Sex kort staplade på mobil blev nära 1 400 px. Tre räcker där, som de två
// uppdragen i Senaste uppdragen; resten nås via Alla tjänster.
const MOBILE_VISIBLE = 3

/** Gemensamt omslag, så att skelettet tar samma plats som den färdiga sektionen. */
function Section({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    // Utfyllnaden ligger utanför max-w-7xl, som i övriga sektioner. Inuti
    // blev innehållet 64 px smalare och linjerade inte med resten av sidan.
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">{header}</div>
        {children}
      </div>
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
          <div key={i} className={`surface flex-col gap-3 p-6 ${i >= MOBILE_VISIBLE ? 'hidden sm:flex' : 'flex'}`}>
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
        {services.map((service, index) => (
          <div key={service.id} className={`min-w-0 ${index >= MOBILE_VISIBLE ? 'hidden sm:block' : ''}`}>
            <ServiceCard service={service} />
          </div>
        ))}
      </div>
    </Section>
  )
}
