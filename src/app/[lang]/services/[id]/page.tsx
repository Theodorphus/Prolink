import type { Metadata } from 'next'
import { isUuid } from '@/lib/validation'
import { notFound } from 'next/navigation'
import Link from '@/components/i18n/Link'
import Image from 'next/image'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/categories'
import CategoryThumb from '@/components/ui/CategoryThumb'
import { getCategoryContent } from '@/lib/category-content'
import ReviewCard from '@/components/reviews/ReviewCard'
import StarRating from '@/components/reviews/StarRating'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbList, metaDescription, pageMetadata } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { getLocale, getT } from '@/i18n/server'
import { localePath } from '@/i18n/config'
import { translateListing } from '@/lib/content-translation'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  if (!isUuid(params.id)) notFound()
  const locale = await getLocale()
  const t = await getT()
  const supabase = await createClient()
  const { data: row } = await supabase
    .from('services')
    .select('id, title, description, price, delivery_time, category, provider:users(name, role)')
    .eq('id', params.id)
    .maybeSingle()
  if (!row) return { title: t('Tjänst'), robots: { index: false, follow: false } }
  const data = await translateListing('service', row, locale)
  const provider = Array.isArray(data.provider) ? data.provider[0] : data.provider

  // Beskrivningen skrivs av leverantören och kan vara några få ord, så den
  // kompletteras med det en sökande faktiskt jämför: pris och leveranstid.
  return {
    ...pageMetadata({
      title: `${data.title} – ${getCategoryLabel(data.category, t)}`,
      description: metaDescription(
        provider?.name ? t('{title} av {name}.', { title: data.title, name: provider.name }) : `${data.title}.`,
        t('Från {price}, leveranstid {time}.', { price: formatCurrency(data.price, locale), time: data.delivery_time }),
        data.description,
      ),
      path: `/services/${params.id}`,
      locale,
      routeImage: true,
    }),
    // En dold tjänst ska inte indexeras; den finns bara kvar för gamla länkar.
    ...(provider && provider.role !== 'provider' ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function ServicePage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ original?: string }> }) {
  const params = await props.params
  const { original } = await props.searchParams
  if (!isUuid(params.id)) notFound()
  const locale = await getLocale()
  const t = await getT()
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  const { data: service, error: detailError } = await supabase
    .from('services')
    .select('*, provider:users(id, role, name, bio, avatar_url, skills, hourly_rate, linkedin_url, created_at)')
    .eq('id', params.id)
    .single()

  if (detailError && detailError.code !== 'PGRST116') throw new Error('Sidan kunde inte hämtas.')
  if (!service) notFound()
  const shown = await translateListing('service', service, locale, { original: original === '1' })

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
  const [{ data: badgeRows }, { data: referenceRows }] = await Promise.all([
    supabase.rpc('company_badge', { p_user_id: provider.id }),
    supabase.rpc('external_reference_list', { p_user_id: provider.id }),
  ])
  const verified = Boolean((badgeRows as unknown[] | null)?.length)
  const referenceCount = (referenceRows as unknown[] | null)?.length ?? 0

  const isOwn = user?.id === provider.id
  // Efter ett rollbyte till uppdragsgivare kan ägaren inte ta emot
  // förfrågningar, så knappen skulle bara leda till 404.
  const isActiveProvider = provider.role === 'provider'

  const categoryLabel = getCategoryLabel(service.category, t)
  // Brödsmulan leder till kategorins landningssida när en sådan finns.
  const categoryPath = service.category && getCategoryContent(service.category)
    ? localePath(locale, `/hitta/${service.category}`)
    : localePath(locale, `/services?category=${service.category ?? ''}`)
  const structuredData = [
    breadcrumbList([
      { name: t('Start'), path: localePath(locale, '/') },
      { name: t('Tjänster'), path: localePath(locale, '/services') },
      { name: categoryLabel, path: categoryPath },
      { name: shown.title, path: localePath(locale, `/services/${service.id}`) },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: shown.title,
      description: shown.description?.slice(0, 500),
      serviceType: categoryLabel,
      url: absoluteUrl(localePath(locale, `/services/${service.id}`)),
      areaServed: { '@type': 'Country', name: locale === 'en' ? 'Sweden' : 'Sverige' },
      provider: { '@type': 'Person', name: provider.name, url: absoluteUrl(localePath(locale, `/profile/${provider.id}`)) },
      offers: { '@type': 'Offer', price: service.price, priceCurrency: 'SEK', url: absoluteUrl(localePath(locale, `/services/${service.id}`)) },
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {isActiveProvider && <JsonLd data={structuredData} />}
      <Link href="/services" className="text-sm font-bold text-slate-500 transition hover:text-blue-700">
        {t('← Alla tjänster')}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            {service.category && (
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-blue-700">
                <CategoryThumb category={service.category} size={44} />
                {getCategoryLabel(service.category, t)}
              </div>
            )}
            <h1 className="page-heading mt-4 text-3xl sm:text-4xl">{shown.title}</h1>
            <p className="muted mt-2 text-sm">
              {t('Publicerad')} {formatDate(service.created_at, locale)}
              {service.edited_at && ` · ${t('Redigerad')} ${formatDate(service.edited_at, locale)}`}
            </p>
          </div>

          <section className="surface p-7">
            <h2 className="page-heading text-lg">{t('Om tjänsten')}</h2>
            {shown.autoTranslated && (
              <p className="mt-2 text-xs font-medium text-slate-500">
                {t('Automatiskt översatt.')}{' '}
                <Link href={`/services/${service.id}?original=1`} className="font-semibold underline underline-offset-2">{t('Visa originalet')}</Link>
              </p>
            )}
            {original === '1' && (
              <p className="mt-2 text-xs font-medium text-slate-500">
                {t('Visar originaltexten.')}{' '}
                <Link href={`/services/${service.id}`} className="font-semibold underline underline-offset-2">{t('Visa översättningen')}</Link>
              </p>
            )}
            <div className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">
              {shown.description}
            </div>
          </section>

          {reviews && reviews.length > 0 && (
            <section>
              <h2 className="page-heading mb-4 text-lg">
                {t('Omdömen om {name}', { name: provider.name })}
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
                  {t('Se alla {count} omdömen →', { count: reviewCount })}
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
                  {formatCurrency(service.price, locale)}
                </p>
                {/* Databasen har ett enda prisfält utan omfattning, så priset
                    märks som frånpris i stället för fast pris. */}
                <p className="muted mt-1 text-xs font-medium">
                  {t('frånpris')} · {service.vat_included === true ? t('inklusive moms') : service.vat_included === false ? t('exklusive moms') : t('moms avtalas med leverantören')}
                  <br />{t('Slutligt pris och omfattning avtalas med leverantören')}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('Leveranstid')}</p>
                <p className="mt-0.5 font-bold text-slate-900">{service.delivery_time}</p>
              </div>

              {isOwn ? (
                <div className="space-y-2">
                <p className="rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-800">
                  {isActiveProvider ? t('Det här är din tjänst') : t('Din tjänst är dold medan du är uppdragsgivare')}
                </p>
                  {isActiveProvider && (
                    <Link
                      href={`/services/${service.id}/edit`}
                      className="block rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      {t('Redigera tjänst')}
                    </Link>
                  )}
                </div>
              ) : !isActiveProvider ? (
                <p className="rounded-xl bg-slate-50 p-3 text-center text-sm font-semibold text-slate-600">
                  {t('Leverantören tar inte emot förfrågningar just nu.')}
                </p>
              ) : (
                <Link
                  href={`/jobs/create?service=${service.id}`}
                  className="block rounded-xl bg-blue-700 px-5 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                >
                  {t('Skicka förfrågan')}
                </Link>
              )}

              <p className="muted text-center text-xs leading-5">
                {t('Ni kommer överens om omfattning och betalning direkt med varandra.')}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('Leverantör')}</p>

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
                    <p className="text-sm text-slate-500">{formatCurrency(provider.hourly_rate, locale)}{t('/tim')}</p>
                  )}
                  {(verified || referenceCount > 0) && (
                    <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                      {[verified && t('✓ Verifierat företag'), referenceCount > 0 && `${referenceCount} ${referenceCount === 1 ? t('referens') : t('referenser')}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </Link>

              {avgRating !== null ? (
                <div className="flex items-center gap-2 border-y border-slate-100 py-3">
                  <StarRating value={Math.round(avgRating)} readonly size="sm" />
                  <span className="text-xs font-medium text-slate-600">
                    {t('{rating} av 5', { rating: avgRating.toFixed(1) })}
                  </span>
                </div>
              ) : (
                <p className="muted border-y border-slate-100 py-3 text-xs">{t('Inga omdömen ännu')}</p>
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

              <p className="muted text-xs">{t('Medlem sedan')} {formatDate(provider.created_at, locale)}</p>

              <Link
                href={`/profile/${provider.id}`}
                className="block rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:shadow-sm"
              >
                {t('Visa hela profilen')}
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  )
}
