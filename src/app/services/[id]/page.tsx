import type { Metadata } from 'next'
import { isUuid } from '@/lib/validation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryEmoji, getCategoryLabel } from '@/lib/categories'
import { getCategoryContent } from '@/lib/category-content'
import ReviewCard from '@/components/reviews/ReviewCard'
import StarRating from '@/components/reviews/StarRating'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbList, metaDescription, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  if (!isUuid(params.id)) notFound()
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('title, description, price, delivery_time, category, provider:users(name, role)')
    .eq('id', params.id)
    .maybeSingle()
  if (!data) return { title: 'Tjänst', robots: { index: false, follow: false } }
  const provider = Array.isArray(data.provider) ? data.provider[0] : data.provider

  // Beskrivningen skrivs av leverantören och kan vara några få ord, så den
  // kompletteras med det en sökande faktiskt jämför: pris och leveranstid.
  return {
    ...pageMetadata({
      title: `${data.title} – ${getCategoryLabel(data.category)}`,
      description: metaDescription(
        `${data.title}${provider?.name ? ` av ${provider.name}` : ''}.`,
        `Från ${formatCurrency(data.price)}, leveranstid ${data.delivery_time}.`,
        data.description,
      ),
      path: `/services/${params.id}`,
      routeImage: true,
    }),
    // En dold tjänst ska inte indexeras; den finns bara kvar för gamla länkar.
    ...(provider && provider.role !== 'provider' ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function ServicePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  if (!isUuid(params.id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  const { data: service, error: detailError } = await supabase
    .from('services')
    .select('*, provider:users(id, role, name, bio, avatar_url, skills, hourly_rate, linkedin_url, created_at)')
    .eq('id', params.id)
    .single()

  if (detailError && detailError.code !== 'PGRST116') throw new Error('Sidan kunde inte hämtas.')
  if (!service) notFound()

  const provider = Array.isArray(service.provider) ? service.provider[0] : service.provider
  if (!provider) notFound()

  // Omdömen gäller personen, inte den enskilda tjänsten. Datamodellen kopplar
  // omdömen till offerter, så det finns ingen tjänstespecifik betygsättning.
    // reviews har två främmande nycklar till users, reviewer_id och
    // reviewee_id, så en inbäddning som bara säger users är tvetydig och
    // avvisas av PostgREST med 300. Relationen namnges därför explicit.
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url)')
    .eq('reviewee_id', provider.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: summary, error: summaryError } = await supabase.rpc('review_summary', { p_user_id: provider.id }).single()
  if (summaryError) throw new Error('Omdömen kunde inte hämtas.')
  const reviewCount = (summary as { total: number; average: number | null }).total
  const avgRating = (summary as { total: number; average: number | null }).average

  const isOwn = user?.id === provider.id
  // Efter ett rollbyte till uppdragsgivare kan ägaren inte ta emot
  // förfrågningar, så knappen skulle bara leda till 404.
  const isActiveProvider = provider.role === 'provider'

  const categoryLabel = getCategoryLabel(service.category)
  // Brödsmulan leder till kategorins landningssida när en sådan finns.
  const categoryPath = service.category && getCategoryContent(service.category)
    ? `/hitta/${service.category}`
    : `/services?category=${service.category ?? ''}`
  const structuredData = [
    breadcrumbList([
      { name: 'Start', path: '/' },
      { name: 'Tjänster', path: '/services' },
      { name: categoryLabel, path: categoryPath },
      { name: service.title, path: `/services/${service.id}` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.description?.slice(0, 500),
      serviceType: categoryLabel,
      url: absoluteUrl(`/services/${service.id}`),
      areaServed: { '@type': 'Country', name: 'Sverige' },
      provider: { '@type': 'Person', name: provider.name, url: absoluteUrl(`/profile/${provider.id}`) },
      offers: { '@type': 'Offer', price: service.price, priceCurrency: 'SEK', url: absoluteUrl(`/services/${service.id}`) },
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {isActiveProvider && <JsonLd data={structuredData} />}
      <Link href="/services" className="text-sm font-bold text-slate-500 transition hover:text-blue-700">
        ← Alla tjänster
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            {service.category && (
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-blue-700">
                <span className="rounded-xl bg-blue-50 p-2 text-xl" aria-hidden>
                  {getCategoryEmoji(service.category)}
                </span>
                {getCategoryLabel(service.category)}
              </div>
            )}
            <h1 className="page-heading mt-4 text-3xl sm:text-4xl">{service.title}</h1>
            <p className="muted mt-2 text-sm">Publicerad {formatDate(service.created_at)}</p>
          </div>

          <section className="surface p-7">
            <h2 className="page-heading text-lg">Om tjänsten</h2>
            <div className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">
              {service.description}
            </div>
          </section>

          {reviews && reviews.length > 0 && (
            <section>
              <h2 className="page-heading mb-4 text-lg">
                Omdömen om {provider.name}
                {typeof reviewCount === 'number' && reviewCount > 0 ? ` (${reviewCount})` : ''}
              </h2>
              <div className="surface divide-y divide-slate-100 px-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={{ ...review, reviewer: Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer }} />
                ))}
              </div>
              {typeof reviewCount === 'number' && reviewCount > reviews.length && (
                <Link
                  href={`/profile/${provider.id}`}
                  className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline"
                >
                  Se alla {reviewCount} omdömen →
                </Link>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-3xl font-black tracking-[-0.03em] text-slate-950">
                  {formatCurrency(service.price)}
                </p>
                {/* Databasen har ett enda prisfält utan omfattning, så priset
                    märks som frånpris i stället för fast pris. */}
                <p className="muted mt-1 text-xs font-medium">
                  frånpris · {service.vat_included === true ? 'inklusive moms' : service.vat_included === false ? 'exklusive moms' : 'moms avtalas med leverantören'}
                  <br />Slutligt pris och omfattning avtalas med leverantören
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leveranstid</p>
                <p className="mt-0.5 font-bold text-slate-900">{service.delivery_time}</p>
              </div>

              {isOwn ? (
                <p className="rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-800">
                  {isActiveProvider ? 'Det här är din tjänst' : 'Din tjänst är dold medan du är uppdragsgivare'}
                </p>
              ) : !isActiveProvider ? (
                <p className="rounded-xl bg-slate-50 p-3 text-center text-sm font-semibold text-slate-600">
                  Leverantören tar inte emot förfrågningar just nu.
                </p>
              ) : user ? (
                <Link
                  href={`/jobs/create?service=${service.id}`}
                  className="block rounded-xl bg-blue-700 px-5 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                >
                  Skicka förfrågan
                </Link>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/jobs/create?service=${service.id}`)}`}
                  className="block rounded-xl bg-blue-700 px-5 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                >
                  Logga in för att kontakta
                </Link>
              )}

              <p className="muted text-center text-xs leading-5">
                Ni kommer överens om omfattning och betalning direkt med varandra.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Leverantör</p>

              <Link href={`/profile/${provider.id}`} className="group flex items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-black text-blue-700">
                  {provider.avatar_url ? (
                    <Image
                      src={provider.avatar_url}
                      alt={provider.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    provider.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                    {provider.name}
                  </p>
                  {provider.hourly_rate && (
                    <p className="text-sm text-slate-500">{formatCurrency(provider.hourly_rate)}/tim</p>
                  )}
                </div>
              </Link>

              {avgRating !== null ? (
                <div className="flex items-center gap-2 border-y border-slate-100 py-3">
                  <StarRating value={Math.round(avgRating)} readonly size="sm" />
                  <span className="text-xs font-medium text-slate-600">
                    {avgRating.toFixed(1)} av 5
                  </span>
                </div>
              ) : (
                <p className="muted border-y border-slate-100 py-3 text-xs">Inga omdömen ännu</p>
              )}

              {provider.bio && (
                <p className="text-sm leading-6 text-slate-600">{provider.bio}</p>
              )}

              {provider.skills && provider.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {provider.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <p className="muted text-xs">Medlem sedan {formatDate(provider.created_at)}</p>

              <Link
                href={`/profile/${provider.id}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:shadow-sm"
              >
                Visa hela profilen
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  )
}
