import { Suspense } from 'react'
import Link from '@/components/i18n/Link'
import { createPublicClient } from '@/lib/supabase/public'
import { unstable_cache } from 'next/cache'
import Hero from '@/components/home/Hero'
import ProcessTimeline from '@/components/home/ProcessTimeline'
import FeaturedServices from '@/components/home/FeaturedServices'
import CompetenceGrid from '@/components/home/CompetenceGrid'
import TrustSection from '@/components/home/TrustSection'
import AudienceCards from '@/components/home/AudienceCards'
import LatestJobs, { LatestJobsSkeleton } from '@/components/home/LatestJobs'
import JsonLd from '@/components/seo/JsonLd'
import { pageMetadata } from '@/lib/seo'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/site'
import { PUBLIC_JOBS_TAG } from '@/lib/revalidate'
import { getLocale, getT } from '@/i18n/server'

// Startsidan förrenderas och byggs om högst en gång i minuten, i takt med
// cachen för siffror, tjänster och uppdrag nedan.
export const revalidate = 60

// Titelmallen "%s | Prolink" gäller bara undersidor, inte rotsidan, så
// varumärket fanns inte med i startsidans titel. Det anges därför här.
export async function generateMetadata() {
  const locale = await getLocale()
  const t = await getT()
  return pageMetadata({
    absoluteTitle: t('Prolink – hitta rätt frilansare för ditt företag'),
    description: t('Prolink kopplar ihop svenska företag med frilansare inom IT, design, ekonomi, juridik och marknadsföring. Kostnadsfritt att publicera uppdrag.'),
    path: '/',
    locale,
  })
}

const organization = (locale: 'sv' | 'en') => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Prolink',
      url: SITE_URL,
      logo: `${SITE_URL}/brand/prolink-icon-512.png`,
      email: CONTACT_EMAIL,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Prolink',
      url: SITE_URL,
      inLanguage: locale === 'en' ? 'en' : 'sv-SE',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
})

// Siffrorna låg tidigare i sidkomponenten, så hela startsidan väntade på tre
// databasanrop innan något alls kunde skickas till webbläsaren. Det gjorde
// Suspense-gränsen runt LatestJobs verkningslös. Nu streamas skalet direkt och
// bara det här avsnittet väntar på sina siffror.
const publicCounts = unstable_cache(async () => {
  const supabase = createPublicClient()
  const results = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'provider'),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    // Samma urval som tjänstelistorna: bara tjänster från aktiva leverantörer.
    supabase.from('services').select('id, provider:users!inner(role)', { count: 'exact', head: true }).eq('provider.role', 'provider'),
  ])
  if (results.some(result => result.error)) throw new Error('Public counts unavailable')
  return results.map(result => result.count ?? 0)
}, ['public-home-counts'], { revalidate: 60, tags: [PUBLIC_JOBS_TAG] })
async function TrustSectionWithCounts() {
  const t = await getT()
  let counts: number[]
  try { counts = await publicCounts() }
  catch { return <p className="py-8 text-center text-sm text-slate-500">{t('Aktuella siffror kunde inte hämtas just nu.')}</p> }
  return (
    <TrustSection
      providerCount={counts[0]}
      openJobCount={counts[1]}
      serviceCount={counts[2]}
    />
  )
}

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getT()
  return (
    <>
      <JsonLd data={organization(locale)} />
      <Hero />
      <Suspense fallback={<LatestJobsSkeleton />}><FeaturedServices /></Suspense>
      <ProcessTimeline />

      <section className="border-b border-slate-200/70 bg-white px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="page-eyebrow">{t('Aktuellt just nu')}</p>
              <h2 className="page-heading mt-3 text-[2rem] sm:text-4xl">{t('Senaste uppdragen')}</h2>
            </div>
            <Link
              href="/jobs"
              className="hidden shrink-0 text-sm font-bold text-slate-600 transition hover:text-blue-700 sm:block"
            >
              {t('Alla uppdrag →')}
            </Link>
          </div>

          <Suspense fallback={<LatestJobsSkeleton />}>
            <LatestJobs />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={<CompetenceGrid pending />}>
        <CompetenceGrid />
      </Suspense>

      <Suspense fallback={<TrustSection providerCount={0} openJobCount={0} serviceCount={0} pending />}>
        <TrustSectionWithCounts />
      </Suspense>

      <AudienceCards />
    </>
  )
}
