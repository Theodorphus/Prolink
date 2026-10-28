import LinkifiedText from '@/components/ui/LinkifiedText'
import type { Metadata } from 'next'
import { isUuid } from '@/lib/validation'
import { notFound } from 'next/navigation'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbList, metaDescription, pageMetadata } from '@/lib/seo'
import Link from '@/components/i18n/Link'
import Image from 'next/image'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/categories'
import { localePath } from '@/i18n/config'
import CategoryThumb from '@/components/ui/CategoryThumb'
import CloseJobButton from '@/components/jobs/CloseJobButton'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'
import { getLocale, getT } from '@/i18n/server'
import { translateListing } from '@/lib/content-translation'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  if (!isUuid(id)) notFound()
  const locale = await getLocale()
  const t = await getT()
  const supabase = await createClient()
  const { data: row } = await supabase.from('jobs').select('id, title, description, category, location, budget, status, archived_at').eq('id', id).maybeSingle()
  if (!row) return { title: t('Uppdrag'), robots: { index: false, follow: false } }
  const data = await translateListing('job', row, locale)

  const category = getCategoryLabel(data.category, t).toLowerCase()
  const facts = t('Uppdrag inom {category}', { category }) + (data.location ? t(' i {location}', { location: data.location }) : '') + (data.budget ? t(', budget {budget}', { budget: formatCurrency(data.budget, locale) }) : '') + '.'
  return {
    ...pageMetadata({
      title: t('{title} – uppdrag inom {category}', { title: data.title, category }),
      description: metaDescription(facts, data.description),
      path: `/jobs/${id}`,
      locale,
      routeImage: true,
    }),
    // Stängda och arkiverade uppdrag går inte att svara på. De ligger kvar
    // för parternas skull men ska inte konkurrera med öppna uppdrag i sök.
    ...(data.status !== 'open' || data.archived_at ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function JobPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ original?: string }> }) {
  const { id } = await props.params
  const { original } = await props.searchParams
  if (!isUuid(id)) notFound()
  const locale = await getLocale()
  const t = await getT()
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  // Kolumnerna speglar PUBLIC_JOB_FIELDS och utelämnar employer_email/contact_info.
  // Literalen behålls här eftersom .single() förlorar typinferensen med en mall-literal.
  const { data: job, error: detailError } = await supabase
    .from('jobs')
    .select('id, customer_id, title, description, budget, status, archived_at, created_at, edited_at, category, location, work_type, customer:users!jobs_customer_id_fkey(id, name, bio, avatar_url, created_at)')
    .eq('id', id)
    .single()

  if (detailError && detailError.code !== 'PGRST116') throw new Error('Sidan kunde inte hämtas.')
  if (!job) notFound()
  const shown = await translateListing('job', job, locale, { original: original === '1' })

  // Supabase typar den inbäddade relationen som en array eftersom FK-relationen
  // inte finns i de handunderhållna typerna. .single() ger alltid en rad.
  const customer = Array.isArray(job.customer) ? job.customer[0] : job.customer

  const isOwner = user?.id === job.customer_id

  // Rollfrågan och ägarens offertlista är oberoende av varandra och kördes
  // tidigare i följd. Den egna offerten behöver rollen först, så den hämtas
  // efteråt. RLS skyddar urvalet i båda fallen.
  const [{ data: viewerProfile }, { data: offers }] = await Promise.all([
    user
      ? supabase.from('users').select('role').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    isOwner
      ? supabase
          .from('offers')
          .select('id, price, price_type, timeline, description, status, provider:users(name, avatar_url)')
          .eq('job_id', job.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),
  ])

  const isProvider = viewerProfile?.role === 'provider'
  const isArchived = job.archived_at !== null

  // Hämtas oavsett nuvarande roll: den som lämnat en offert och sedan bytt
  // till uppdragsgivare är fortfarande part i affären.
  const { data: existingOffer } = user && !isOwner
    ? await supabase.from('offers').select('id, status').eq('job_id', job.id).eq('provider_id', user.id).maybeSingle()
    : { data: null }

  // Ett arkiverat uppdrag är borttaget ur allas flöden. Bara uppdragsgivaren och
  // den som lämnat offert, som är part i det, kan fortfarande öppna det.
  if (isArchived && !isOwner && !existingOffer) notFound()

  const workType =
    job.work_type === 'remote'
      ? t('På distans')
      : job.work_type === 'onsite'
        ? t('På plats')
        : job.work_type === 'hybrid'
          ? t('Hybrid')
          : null

  // Offerttabellen är läsbar endast för uppdragets parter, så en publik besökare
  // skulle alltid få noll. Siffran visas därför bara för ägaren, där den stämmer.
  const offerCount = isOwner ? offers?.length ?? 0 : null

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbList([
        { name: t('Start'), path: localePath(locale, '/') },
        { name: t('Uppdrag'), path: localePath(locale, '/jobs') },
        { name: shown.title, path: localePath(locale, `/jobs/${job.id}`) },
      ])} />
      <div className="mx-auto max-w-6xl">
        <Link href="/jobs" className="text-sm font-bold text-slate-500 transition hover:text-blue-700">
          {t('← Alla uppdrag')}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* div, inte main: layouten har redan sidans enda main. */}
          <div className="space-y-6">
            <section className="surface p-7 sm:p-9">
              {/* Statusen ligger på kategoriraden. Bredvid rubriken tryckte
                  den ihop rubriken till tre rader på mobil och krockade med
                  kategorietiketten. */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-blue-700">
                  <CategoryThumb category={job.category} size={44} />
                  {getCategoryLabel(job.category, t)}
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                    job.status === 'open'
                      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                      : 'bg-slate-50 text-slate-600 ring-slate-200'
                  }`}
                >
                  {job.status === 'open' ? t('Öppet för offerter') : isArchived ? t('Arkiverat') : t('Stängt')}
                </span>
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
                {shown.title}
              </h1>

              {/* Nyckeltalen samlas i ett rutnät i stället för en radda text, så
                  att budget, arbetsform och plats går att skanna. */}
              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-slate-100 py-5 sm:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('Budget')}</dt>
                  <dd className="mt-1 font-black text-slate-900">
                    {job.budget ? formatCurrency(job.budget, locale) : t('Öppen')}
                  </dd>
                </div>
                {workType && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('Arbetsform')}</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{workType}</dd>
                  </div>
                )}
                {job.location && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('Plats')}</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{job.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('Publicerat')}</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{formatDate(job.created_at, locale)}</dd>
                  {/* Leverantörer som redan lämnat offert ska se att villkoren kan ha ändrats. */}
                  {job.edited_at && (
                    <dd className="mt-0.5 text-xs text-slate-500">{t('Redigerat')} {formatDate(job.edited_at, locale)}</dd>
                  )}
                </div>
              </dl>

              {/* Beskrivningen är uppdragets huvudinnehåll och får en egen
                  rubrik i stället för att flyta som lös text. */}
              <div className="mt-7">
                <h2 className="page-heading text-lg">{t('Om uppdraget')}</h2>
                {shown.autoTranslated && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {t('Automatiskt översatt.')}{' '}
                    <Link href={`/jobs/${job.id}?original=1`} className="font-semibold underline underline-offset-2">{t('Visa originalet')}</Link>
                  </p>
                )}
                {original === '1' && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {t('Visar originaltexten.')}{' '}
                    <Link href={`/jobs/${job.id}`} className="font-semibold underline underline-offset-2">{t('Visa översättningen')}</Link>
                  </p>
                )}
                <LinkifiedText text={shown.description} className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700" />
              </div>
            </section>

            {isOwner && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="page-eyebrow">{t('Inkomna förslag')}</p>
                    <h2 className="page-heading mt-1 text-2xl">{t('Offerter')} ({offerCount})</h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {offers?.map(offer => {
                    const provider = Array.isArray(offer.provider) ? offer.provider[0] : offer.provider
                    return (
                      <Link key={offer.id} href={`/offers/${offer.id}`} className="block">
                        <article className="surface surface-interactive p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {provider?.avatar_url ? (
                                <Image
                                  src={provider.avatar_url}
                                  alt={provider.name}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                                  {provider?.name?.[0] ?? '?'}
                                </span>
                              )}
                              <div>
                                <p className="font-bold">{provider?.name ?? t('Leverantör')}</p>
                                <p className="text-xs text-slate-500">{offer.timeline}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-blue-700">
                                {formatCurrency(offer.price, locale)}
                                {offer.price_type === 'hourly' ? t('/tim') : ''}
                              </p>
                              <div className="mt-1.5">
                                <StatusBadge status={offer.status} />
                              </div>
                            </div>
                          </div>
                          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{offer.description}</p>
                        </article>
                      </Link>
                    )
                  })}

                  {(!offers || offers.length === 0) && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                      {t('Inga offerter ännu. Du får en avisering när någon svarar.')}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            {isOwner ? (
              <Card>
                <CardBody className="space-y-3">
                  <p className="rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-800">
                    {t('Det här är ditt uppdrag')}
                  </p>
                  {isArchived ? (
                    <p className="text-center text-sm text-slate-600">
                      {t('Uppdraget är arkiverat och visas inte längre på din profil. Offerter och meddelanden finns kvar.')}
                    </p>
                  ) : (
                    <>
                      {job.status === 'open' && (
                        <>
                          <Link
                            href={`/jobs/${job.id}/edit`}
                            className="block rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:shadow-sm"
                          >
                            {t('Redigera uppdrag')}
                          </Link>
                          <CloseJobButton jobId={job.id} />
                        </>
                      )}
                      <DeleteJobButton jobId={job.id} />
                    </>
                  )}
                </CardBody>
              </Card>
            ) : existingOffer ? (
              // Kontrolleras före stängt-läget: när en offert accepteras stängs
              // uppdraget, och då tappade den vinnande leverantören länken.
              <Link
                href={`/offers/${existingOffer.id}`}
                className="block rounded-xl bg-slate-950 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {t('Visa din offert')}
              </Link>
            ) : job.status !== 'open' ? (
              <Card>
                <CardBody className="text-center text-sm font-medium text-slate-500">
                  {t('Uppdraget tar inte längre emot offerter.')}
                </CardBody>
              </Card>
            ) : isProvider ? (
              <Link
                href={`/jobs/${job.id}/offer`}
                className="block rounded-xl bg-blue-700 px-6 py-4 text-center text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                {t('Lämna offert')}
              </Link>
            ) : user ? (
              <Card>
                <CardBody className="text-center text-sm text-slate-600">
                  {t('Byt till frilansare i din profil för att lämna offert.')}
                </CardBody>
              </Card>
            ) : (
              <Link
                href={`/login?redirect=/jobs/${job.id}/offer`}
                className="block rounded-xl bg-blue-700 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-blue-800"
              >
                {t('Logga in för att lämna offert')}
              </Link>
            )}

            {/* Förklarar vad som händer efter en offert. Utan det vet varken
                köpare eller frilansare vad knappen ovanför leder till. */}
            {!isOwner && job.status === 'open' && (
              <Card>
                <CardBody>
                  <h2 className="text-sm font-bold text-slate-900">{t('Så fungerar en offert')}</h2>
                  <ol className="mt-3 space-y-2.5 text-xs leading-5 text-slate-600">
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>1.</span>
                      {t('Du föreslår pris, tidsestimat och upplägg.')}
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>2.</span>
                      {t('Kunden jämför offerterna och accepterar en.')}
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>3.</span>
                      {t('En chatt öppnas mellan er för detaljerna.')}
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>4.</span>
                      {t('Du markerar levererat och kunden godkänner.')}
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>5.</span>
                      {t('Ni lämnar omdömen om varandra.')}
                    </li>
                  </ol>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    {t('Betalning sker utanför Prolink, direkt mellan er.')}
                  </p>
                </CardBody>
              </Card>
            )}

            {customer && (
              <Card>
                <CardBody className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t('Publicerat av')}
                  </p>
                  <Link href={`/profile/${customer.id}`} className="group flex items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
                      {customer.avatar_url ? (
                        <Image
                          src={customer.avatar_url}
                          alt={customer.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        customer.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                        {customer.name ?? t('Prolink-kund')}
                      </p>
                      {customer.created_at && (
                        <p className="text-xs text-slate-500">
                          {t('Medlem sedan')} {formatDate(customer.created_at, locale)}
                        </p>
                      )}
                    </div>
                  </Link>
                  {customer.bio && (
                    <p className="line-clamp-3 text-sm leading-6 text-slate-600">{customer.bio}</p>
                  )}
                  <Link
                    href={`/profile/${customer.id}`}
                    className="block rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    {t('Visa profil')}
                  </Link>
                </CardBody>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
