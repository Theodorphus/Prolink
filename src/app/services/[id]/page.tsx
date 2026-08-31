import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryEmoji, getCategoryLabel } from '@/lib/categories'
import ReviewCard from '@/components/reviews/ReviewCard'
import StarRating from '@/components/reviews/StarRating'

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const { data } = await supabase.from('services').select('title, description').eq('id', params.id).single()
  return {
    title: data?.title ?? 'Tjänst',
    description: data?.description?.slice(0, 155) ?? 'Se tjänstedetaljer och kontakta leverantören på Prolink.',
  }
}

export default async function ServicePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: service } = await supabase
    .from('services')
    .select('*, provider:users(id, name, bio, avatar_url, skills, hourly_rate, linkedin_url, created_at)')
    .eq('id', params.id)
    .single()

  if (!service) notFound()

  const provider = Array.isArray(service.provider) ? service.provider[0] : service.provider
  if (!provider) notFound()

  // Omdömen gäller personen, inte den enskilda tjänsten. Datamodellen kopplar
  // omdömen till offerter, så det finns ingen tjänstespecifik betygsättning.
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:users(id, name, avatar_url)')
    .eq('reviewee_id', provider.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('reviewee_id', provider.id)

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  const isOwn = user?.id === provider.id

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
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
                {reviews.map((review: any) => (
                  <ReviewCard key={review.id} review={review} />
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
                  frånpris · slutligt pris avtalas med leverantören
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leveranstid</p>
                <p className="mt-0.5 font-bold text-slate-900">{service.delivery_time}</p>
              </div>

              {isOwn ? (
                <p className="rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-800">
                  Det här är din tjänst
                </p>
              ) : user ? (
                <Link
                  href={`/profile/${provider.id}`}
                  className="block rounded-xl bg-blue-700 px-5 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                >
                  Diskutera tjänsten
                </Link>
              ) : (
                <Link
                  href={`/login?redirect=/services/${service.id}`}
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
