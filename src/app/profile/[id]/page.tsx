import { isUuid } from '@/lib/validation'
import Pagination from '@/components/ui/Pagination'
import { pageNumber, PAGE_SIZE } from '@/lib/pagination'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, getUser } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/categories'
import EditProfileForm from '@/components/profile/EditProfileForm'
import SwitchRoleButton from '@/components/profile/SwitchRoleButton'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'
import ReviewCard from '@/components/reviews/ReviewCard'
import StarRating from '@/components/reviews/StarRating'

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  if (!isUuid(params.id)) notFound()
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('name, bio, role').eq('id', params.id).single()
  if (!data?.name) return { title: 'Profil' }

  const role = data.role === 'provider' ? 'Frilansare' : 'Kund'
  return {
    alternates: { canonical: `/profile/${params.id}` },
    openGraph: { title: data?.name ?? 'Prolink', url: `/profile/${params.id}` },
    title: data.name,
    description: data.bio?.slice(0, 155) ?? `${data.name} på Prolink. ${role} i det svenska nätverket för specialisttjänster.`,
  }
}

export default async function ProfilePage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams
  const page = pageNumber(searchParams.page)
  const params = await props.params
  if (!isUuid(params.id)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  // Endast publika kolumner. Telefon ligger i user_private_profiles bakom egen
  // RLS och hämtas bara för den inloggade ägaren nedan.
  const { data: profile, error: detailError } = await supabase
    .from('users')
    .select('id, role, name, bio, skills, hourly_rate, avatar_url, linkedin_url, created_at')
    .eq('id', params.id)
    .single()

  if (detailError && detailError.code !== 'PGRST116') throw new Error('Sidan kunde inte hämtas.')
  if (!profile) notFound()

  const isOwn = user?.id === params.id
  const isProvider = profile.role === 'provider'

  const { data: privateProfile, error: privateError } = isOwn
    ? await supabase
        .from('user_private_profiles')
        .select('phone, email_jobs, email_messages, notification_categories')
        .eq('user_id', params.id)
        .maybeSingle()
    : { data: null, error: null }

  if (privateError) throw new Error('Dina inställningar kunde inte hämtas.')

  const [{ data: jobs, count: jobCount, error: jobError }, { data: reviews, count: reviewCount, error: reviewError }, { data: services, count: serviceCount, error: serviceError }] = await Promise.all([
    supabase
      .from('jobs')
      .select(PUBLIC_JOB_FIELDS, { count: 'exact' })
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false })
      .order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    // reviews har två främmande nycklar till users, reviewer_id och
    // reviewee_id, så en inbäddning som bara säger users är tvetydig och
    // avvisas av PostgREST med 300, vilket tog ner hela profilsidan.
    supabase
      .from('reviews')
      .select('*, reviewer:users!reviews_reviewer_id_fkey(id, name, avatar_url)', { count: 'exact' })
      .eq('reviewee_id', params.id)
      .order('created_at', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase
      .from('services')
      .select('id, title, description, price, delivery_time, category', { count: 'exact' })
      .eq('provider_id', params.id)
      .order('created_at', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
  ])

  if (jobError || reviewError || serviceError) throw new Error('Profilens innehåll kunde inte hämtas.')
  const { data: summary, error: summaryError } = await supabase.rpc('review_summary', { p_user_id: params.id }).single()
  if (summaryError) throw new Error('Omdömen kunde inte hämtas.')
  const avgRating = (summary as { average: number | null }).average

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-3">

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4 text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-3xl font-black text-blue-700">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  profile.name?.[0]?.toUpperCase()
                )}
              </div>

              <div>
                <h1 className="page-heading text-xl">{profile.name}</h1>
                <p className="muted mt-1 text-xs font-semibold uppercase tracking-wider">
                  {isProvider ? 'Frilansare' : 'Uppdragsgivare'}
                </p>
              </div>

              {avgRating !== null ? (
                <div className="flex flex-col items-center gap-1.5 border-y border-slate-100 py-4">
                  <StarRating value={Math.round(avgRating)} readonly size="sm" />
                  <p className="text-xs font-medium text-slate-600">
                    {avgRating.toFixed(1)} av 5 · {reviewCount} {reviewCount === 1 ? 'omdöme' : 'omdömen'}
                  </p>
                </div>
              ) : (
                <p className="muted border-y border-slate-100 py-4 text-xs">
                  Inga omdömen ännu
                </p>
              )}

              {profile.bio && (
                <p className="text-left text-sm leading-6 text-slate-600">{profile.bio}</p>
              )}

              {isProvider && profile.hourly_rate && (
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timpris</p>
                  <p className="mt-0.5 text-lg font-black text-slate-900">
                    {formatCurrency(profile.hourly_rate)}<span className="text-sm font-semibold text-slate-500">/tim</span>
                  </p>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Kompetenser</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn-profil
                </a>
              )}

              <p className="muted text-xs">Medlem sedan {formatDate(profile.created_at)}</p>

              {/* Kontakt kräver inloggning först när besökaren faktiskt agerar,
                  inte för att läsa profilen. */}
              {!isOwn && isProvider && (
                user ? (
                  <Link
                    href={`/jobs/create?provider=${profile.id}`}
                    className="block rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                  >
                    Skicka förfrågan
                  </Link>
                ) : (
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/jobs/create?provider=${profile.id}`)}`}
                    className="block rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                  >
                    Logga in för att kontakta
                  </Link>
                )
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-8 lg:col-span-2">

          {isOwn && (
            <EditProfileForm
              profile={{
                ...profile,
                ...privateProfile,
                phone: privateProfile?.phone ?? null,
              }}
            />
          )}

          {/* Kontot har en roll i taget, eftersom user_role är ett enum med
              två värden och fjorton ställen i koden grindar på det. Den som
              vill både köpa och sälja byter i stället roll här; befintliga
              uppdrag, tjänster och omdömen påverkas inte av bytet. */}
          {isOwn && (
            <section className="rounded-panel border border-line-soft bg-surface-card p-6">
              <h2 className="font-bold text-slate-900">
                {isProvider ? 'Vill du också köpa tjänster?' : 'Vill du också erbjuda tjänster?'}
              </h2>
              <p className="muted mt-1.5 text-sm font-medium">
                {isProvider
                  ? 'Byt till uppdragsgivare för att publicera uppdrag och ta emot offerter. Dina tjänster och omdömen finns kvar.'
                  : 'Byt till leverantör för att lägga upp tjänster och lämna offerter på uppdrag. Dina uppdrag och omdömen finns kvar.'}
              </p>
              <div className="mt-4">
                <SwitchRoleButton currentRole={profile.role} userId={profile.id} />
              </div>
            </section>
          )}

          {(isProvider || (services && services.length > 0)) && (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="page-heading text-xl">
                  {isOwn ? 'Dina tjänster' : 'Tjänster'}
                </h2>
                {isOwn && (
                  <Link href="/services/create" className="text-sm font-semibold text-blue-700 hover:underline">
                    Ny tjänst
                  </Link>
                )}
              </div>

              {services && services.length > 0 ? (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {services.map((service) => (
                    <Link key={service.id} href={`/services/${service.id}`} className="group block">
                      <article className="surface surface-interactive flex h-full flex-col gap-2.5 p-5">
                        {service.category && (
                          <span className="self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                            {getCategoryLabel(service.category)}
                          </span>
                        )}
                        <h3 className="font-bold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
                          {service.title}
                        </h3>
                        <p className="line-clamp-2 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
                        <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                          <p className="font-black text-slate-900">{formatCurrency(service.price)}</p>
                          <p className="text-xs font-medium text-slate-500">{service.delivery_time}</p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="surface px-6 py-10 text-center">
                  <p className="muted text-sm">
                    {isOwn
                      ? 'Du har inte publicerat några tjänster ännu.'
                      : 'Den här frilansaren har inga publicerade tjänster ännu.'}
                  </p>
                  {isOwn && (
                    <Link
                      href="/services/create"
                      className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      Publicera en tjänst
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          {(!isProvider || isOwn || (jobs && jobs.length > 0)) && (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="page-heading text-xl">
                  {isOwn ? 'Dina uppdrag' : 'Publicerade uppdrag'}
                </h2>
                {isOwn && (
                  <Link href="/jobs/create" className="text-sm font-semibold text-blue-700 hover:underline">
                    Nytt uppdrag
                  </Link>
                )}
              </div>

              {jobs && jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <Card key={job.id}>
                      <CardBody className="flex items-center justify-between gap-4">
                        <Link href={`/jobs/${job.id}`} className="group min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
                            {job.title}
                          </h3>
                          <p className="muted mt-0.5 text-xs">{formatDate(job.created_at)}</p>
                        </Link>
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              job.status === 'open'
                                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                                : 'bg-slate-50 text-slate-600 ring-slate-200'
                            }`}
                          >
                            {job.status === 'open' ? 'Öppet' : 'Stängt'}
                          </span>
                          {isOwn && <DeleteJobButton jobId={job.id} compact />}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="surface px-6 py-10 text-center">
                  <p className="muted text-sm">
                    {isOwn ? 'Du har inte publicerat några uppdrag ännu.' : 'Inga publicerade uppdrag ännu.'}
                  </p>
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="page-heading mb-4 text-xl">
              Omdömen{(reviewCount ?? 0) > 0 ? ` (${reviewCount})` : ''}
            </h2>
            {reviews && reviews.length > 0 ? (
              <div className="surface divide-y divide-slate-100 px-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={{ ...review, reviewer: Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer }} />
                ))}
              </div>
            ) : (
              <div className="surface px-6 py-10 text-center">
                <p className="muted text-sm">
                  Inga omdömen ännu. Omdömen kan bara lämnas efter ett genomfört uppdrag.
                </p>
              </div>
            )}
          </section>
        </div>

      </div>
      <Pagination page={page} total={Math.max(jobCount ?? 0, reviewCount ?? 0, serviceCount ?? 0)} pageSize={PAGE_SIZE} pathname={`/profile/${params.id}`} params={searchParams} />
    </div>
  )
}
