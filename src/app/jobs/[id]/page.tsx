import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryEmoji, getCategoryLabel } from '@/lib/categories'
import CloseJobButton from '@/components/jobs/CloseJobButton'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('title, description').eq('id', id).single()
  return {
    title: data?.title ?? 'Uppdrag',
    description: data?.description?.slice(0, 155) ?? 'Se uppdraget och lämna en offert på Prolink.',
  }
}

export default async function JobPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Kolumnerna speglar PUBLIC_JOB_FIELDS och utelämnar employer_email/contact_info.
  // Literalen behålls här eftersom .single() förlorar typinferensen med en mall-literal.
  const { data: job } = await supabase
    .from('jobs')
    .select('id, customer_id, title, description, budget, status, created_at, category, salary, location, work_type, employer_name, customer:users(id, name, bio, avatar_url, created_at)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  // Supabase typar den inbäddade relationen som en array eftersom FK-relationen
  // inte finns i de handunderhållna typerna. .single() ger alltid en rad.
  const customer = Array.isArray(job.customer) ? job.customer[0] : job.customer

  const isOwner = user?.id === job.customer_id
  const { data: viewerProfile } = user
    ? await supabase.from('users').select('role').eq('id', user.id).single()
    : { data: null }
  const isProvider = viewerProfile?.role === 'provider'

  const { data: offers } = isOwner
    ? await supabase
        .from('offers')
        .select('id, price, price_type, timeline, description, status, provider:users(name, avatar_url)')
        .eq('job_id', job.id)
        .order('created_at', { ascending: false })
    : { data: null }

  const { data: existingOffer } = user && isProvider
    ? await supabase.from('offers').select('id, status').eq('job_id', job.id).eq('provider_id', user.id).maybeSingle()
    : { data: null }

  const workType =
    job.work_type === 'remote'
      ? 'På distans'
      : job.work_type === 'onsite'
        ? 'På plats'
        : job.work_type === 'hybrid'
          ? 'Hybrid'
          : null

  // Offerttabellen är läsbar endast för uppdragets parter, så en publik besökare
  // skulle alltid få noll. Siffran visas därför bara för ägaren, där den stämmer.
  const offerCount = isOwner ? offers?.length ?? 0 : null

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/jobs" className="text-sm font-bold text-slate-500 transition hover:text-blue-700">
          ← Alla uppdrag
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <main className="space-y-6">
            <section className="surface p-7 sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-blue-700">
                    <span className="rounded-xl bg-blue-50 p-2 text-xl" aria-hidden>
                      {getCategoryEmoji(job.category)}
                    </span>
                    {getCategoryLabel(job.category)}
                  </div>
                  <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
                    {job.title}
                  </h1>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                    job.status === 'open'
                      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                      : 'bg-slate-50 text-slate-600 ring-slate-200'
                  }`}
                >
                  {job.status === 'open' ? 'Öppet för offerter' : 'Stängt'}
                </span>
              </div>

              {/* Nyckeltalen samlas i ett rutnät i stället för en radda text, så
                  att budget, arbetsform och plats går att skanna. */}
              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-slate-100 py-5 sm:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</dt>
                  <dd className="mt-1 font-black text-slate-900">
                    {job.budget ? formatCurrency(job.budget) : 'Öppen'}
                  </dd>
                </div>
                {workType && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Arbetsform</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{workType}</dd>
                  </div>
                )}
                {job.location && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Plats</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{job.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Publicerat</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{formatDate(job.created_at)}</dd>
                </div>
              </dl>

              {/* Beskrivningen är uppdragets huvudinnehåll och får en egen
                  rubrik i stället för att flyta som lös text. */}
              <div className="mt-7">
                <h2 className="page-heading text-lg">Om uppdraget</h2>
                <div className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">
                  {job.description}
                </div>
              </div>
            </section>

            {isOwner && (
              <section>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="page-eyebrow">Inkomna förslag</p>
                    <h2 className="page-heading mt-1 text-2xl">Offerter ({offerCount})</h2>
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
                                <p className="font-bold">{provider?.name ?? 'Leverantör'}</p>
                                <p className="text-xs text-slate-500">{offer.timeline}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-blue-700">
                                {formatCurrency(offer.price)}
                                {offer.price_type === 'hourly' ? '/tim' : ''}
                              </p>
                              <p className="mt-1 text-xs capitalize text-slate-500">{offer.status}</p>
                            </div>
                          </div>
                          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{offer.description}</p>
                        </article>
                      </Link>
                    )
                  })}

                  {(!offers || offers.length === 0) && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                      Inga offerter ännu. Du får en avisering när någon svarar.
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-4">
            {isOwner ? (
              <Card>
                <CardBody className="space-y-3">
                  <p className="rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-800">
                    Det här är ditt uppdrag
                  </p>
                  {job.status === 'open' && <CloseJobButton jobId={job.id} />}
                  <DeleteJobButton jobId={job.id} />
                </CardBody>
              </Card>
            ) : job.status !== 'open' ? (
              <Card>
                <CardBody className="text-center text-sm font-medium text-slate-500">
                  Uppdraget tar inte längre emot offerter.
                </CardBody>
              </Card>
            ) : existingOffer ? (
              <Link
                href={`/offers/${existingOffer.id}`}
                className="block rounded-xl bg-slate-950 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Visa din offert
              </Link>
            ) : isProvider ? (
              <Link
                href={`/jobs/${job.id}/offer`}
                className="block rounded-xl bg-blue-700 px-6 py-4 text-center text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Lämna offert
              </Link>
            ) : user ? (
              <Card>
                <CardBody className="text-center text-sm text-slate-600">
                  Byt till leverantörsrollen i din profil för att lämna offert.
                </CardBody>
              </Card>
            ) : (
              <Link
                href={`/login?redirect=/jobs/${job.id}/offer`}
                className="block rounded-xl bg-blue-700 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Logga in för att lämna offert
              </Link>
            )}

            {/* Förklarar vad som händer efter en offert. Utan det vet varken
                köpare eller frilansare vad knappen ovanför leder till. */}
            {!isOwner && job.status === 'open' && (
              <Card>
                <CardBody>
                  <h2 className="text-sm font-bold text-slate-900">Så fungerar en offert</h2>
                  <ol className="mt-3 space-y-2.5 text-xs leading-5 text-slate-600">
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>1.</span>
                      Du föreslår pris, tidsestimat och upplägg.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>2.</span>
                      Kunden jämför offerterna och accepterar en.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>3.</span>
                      En chatt öppnas mellan er för detaljerna.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>4.</span>
                      Du markerar levererat och kunden godkänner.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-black text-blue-700" aria-hidden>5.</span>
                      Ni lämnar omdömen om varandra.
                    </li>
                  </ol>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Betalning sker utanför Prolink, direkt mellan er.
                  </p>
                </CardBody>
              </Card>
            )}

            {customer && (
              <Card>
                <CardBody className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Publicerat av
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
                        {customer.name ?? 'Prolink-kund'}
                      </p>
                      {customer.created_at && (
                        <p className="text-xs text-slate-500">
                          Medlem sedan {formatDate(customer.created_at)}
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
                    Visa profil
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
