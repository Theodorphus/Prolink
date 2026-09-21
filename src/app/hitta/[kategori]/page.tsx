import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { CATEGORIES, getCategoryLabel } from '@/lib/categories'
import { getCategoryContent, LANDING_CATEGORIES } from '@/lib/category-content'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import JobCard, { type JobCardJob } from '@/components/jobs/JobCard'
import ServiceCard, { type ServiceCardService } from '@/components/services/ServiceCard'
import { SITE_URL } from '@/lib/site'

/**
 * Kategorilandningssida.
 *
 * Marknadsplatsen har ingen sida som svarar på det en köpare faktiskt söker
 * efter ("vad kostar en hemsida", "hitta bokförare"). Startsidan är för bred
 * och /services är en filtrerad lista utan sammanhang. De här sidorna finns
 * för att fånga den sökningen och leda vidare till att publicera ett uppdrag.
 *
 * Datan läses med den publika klienten, utan cookies, så sidan inte behöver
 * någon inloggad session. Rutten renderas ändå per besökare, eftersom Navbar
 * i rotlayouten läser cookies för att visa inloggningsstatus — det gäller
 * hela appen och är inget den här sidan kan påverka. generateStaticParams
 * behålls för att förrendera kategorierna vid bygget.
 */
export function generateStaticParams() {
  return LANDING_CATEGORIES.map(kategori => ({ kategori }))
}

export async function generateMetadata(props: {
  params: Promise<{ kategori: string }>
}): Promise<Metadata> {
  const { kategori } = await props.params
  const content = getCategoryContent(kategori)
  if (!content) return { title: 'Kategorin hittades inte' }

  return {
    title: content.heading,
    description: content.description,
    alternates: { canonical: `/hitta/${kategori}` },
    openGraph: {
      title: content.heading,
      description: content.description,
      url: `${SITE_URL}/hitta/${kategori}`,
      type: 'website',
    },
  }
}

export default async function CategoryLandingPage(props: {
  params: Promise<{ kategori: string }>
}) {
  const { kategori } = await props.params
  const content = getCategoryContent(kategori)
  if (!content) notFound()

  const label = getCategoryLabel(kategori)
  const supabase = createPublicClient()

  const [{ data: jobs }, { data: services }] = await Promise.all([
    supabase
      .from('jobs')
      .select(PUBLIC_JOB_FIELDS)
      .eq('status', 'open')
      .eq('category', kategori)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('services')
      .select('id, title, description, price, delivery_time, category, provider:users(id, name, avatar_url)')
      .eq('category', kategori)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const openJobs = (jobs ?? []) as JobCardJob[]
  const openServices = (services ?? []).map(service => ({
    ...service,
    provider: Array.isArray(service.provider) ? service.provider[0] : service.provider,
  })) as ServiceCardService[]

  // FAQPage-märkning ger sidan chans till utökade sökresultat. Frågorna och
  // svaren är samma som renderas nedan; Google kräver att de stämmer överens.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faq.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  const others = CATEGORIES.filter(
    c => c.value !== kategori && LANDING_CATEGORIES.includes(c.value)
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <nav aria-label="Brödsmulor" className="mb-6 text-sm font-medium text-slate-500">
          <Link href="/" className="hover:text-slate-900">Start</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/services" className="hover:text-slate-900">Tjänster</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-slate-900">{label}</span>
        </nav>

        <header className="max-w-3xl">
          <p className="page-eyebrow">{label}</p>
          <h1 className="page-heading mt-2.5 text-3xl sm:text-4xl">{content.heading}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{content.intro}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/jobs/create?category=${kategori}`}
              className="inline-flex rounded-xl bg-accent-strong px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-accent-deep"
            >
              Publicera uppdrag – kostnadsfritt
            </Link>
            <Link
              href={`/services?category=${kategori}`}
              className="inline-flex rounded-xl border border-slate-300 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Se alla tjänster
            </Link>
          </div>
        </header>

        <section className="mt-16" aria-labelledby="vanliga-uppdrag">
          <h2 id="vanliga-uppdrag" className="page-heading text-2xl">Vanliga uppdrag</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {content.examples.map(example => (
              <li
                key={example}
                className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-card p-4 text-sm font-medium text-slate-700"
              >
                <span aria-hidden="true" className="mt-0.5 text-accent">•</span>
                {example}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="prisguide">
          <h2 id="prisguide" className="page-heading text-2xl">Vad brukar det kosta?</h2>
          <p className="muted mt-2 max-w-2xl text-sm font-medium">
            Spannen är ungefärliga marknadsnivåer och ska ses som en utgångspunkt, inte en
            prislista. Det faktiska priset beror på omfattning och vad som ingår.
          </p>
          <div className="mt-5 overflow-hidden rounded-panel border border-line-soft">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Ungefärliga prisnivåer för {label}</caption>
              <thead className="bg-surface-sunken">
                <tr>
                  <th scope="col" className="px-5 py-3 font-bold text-slate-700">Uppdrag</th>
                  <th scope="col" className="px-5 py-3 text-right font-bold text-slate-700">Prisspann</th>
                </tr>
              </thead>
              <tbody>
                {content.priceGuide.map(row => (
                  <tr key={row.label} className="border-t border-line-soft bg-surface-card">
                    <td className="px-5 py-3.5 font-medium text-slate-700">{row.label}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold text-slate-900">
                      {row.range}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {openServices.length > 0 && (
          <section className="mt-16" aria-labelledby="tjanster">
            <h2 id="tjanster" className="page-heading text-2xl">Tjänster inom {label.toLowerCase()}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {openServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}

        {openJobs.length > 0 && (
          <section className="mt-16" aria-labelledby="uppdrag">
            <h2 id="uppdrag" className="page-heading text-2xl">Öppna uppdrag just nu</h2>
            <div className="mt-5 space-y-3.5">
              {openJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-16" aria-labelledby="faq">
          <h2 id="faq" className="page-heading text-2xl">Vanliga frågor</h2>
          <div className="mt-5 space-y-3">
            {content.faq.map(item => (
              <details
                key={item.q}
                className="group rounded-xl border border-line-soft bg-surface-card p-5"
              >
                <summary className="cursor-pointer list-none font-bold text-slate-900 marker:content-none">
                  <span className="flex items-start justify-between gap-4">
                    {item.q}
                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-accent transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-panel border border-line-soft bg-surface-sunken p-8 sm:p-10">
          <h2 className="page-heading text-2xl">Så fungerar det</h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-3">
            {[
              ['Beskriv uppdraget', 'Berätta vad ni behöver. Det tar några minuter och kostar ingenting.'],
              ['Jämför offerter', 'Leverantörer som matchar får en notis och lämnar förslag med pris och tidsplan.'],
              ['Välj själv', 'Ni väljer vem ni vill gå vidare med. Betalningen sker direkt mellan er.'],
            ].map(([rubrik, text], index) => (
              <li key={rubrik}>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-tint text-sm font-bold text-accent-deep">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{rubrik}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
          <Link
            href={`/jobs/create?category=${kategori}`}
            className="mt-8 inline-flex rounded-xl bg-accent-strong px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-accent-deep"
          >
            Publicera uppdrag
          </Link>
        </section>

        <nav className="mt-16 border-t border-line-soft pt-8" aria-labelledby="andra-kategorier">
          <h2 id="andra-kategorier" className="text-sm font-bold text-slate-700">Andra kategorier</h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {others.map(category => (
              <li key={category.value}>
                <Link
                  href={`/hitta/${category.value}`}
                  className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
