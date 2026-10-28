import { notFound, redirect } from 'next/navigation'
import Link from '@/components/i18n/Link'
import { createClient, getUser } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import LinkifiedText from '@/components/ui/LinkifiedText'
import { formatCurrency, formatDate } from '@/lib/utils'
import AcceptRejectButtons from '@/components/offers/AcceptRejectButtons'
import MarkDeliveredButton from '@/components/offers/MarkDeliveredButton'
import CompleteJobButton from '@/components/offers/CompleteJobButton'
import WriteReviewForm from '@/components/reviews/WriteReviewForm'
import MarkOfferRead from '@/components/offers/MarkOfferRead'
import { getLocale, getT } from '@/i18n/server'
import { localePath } from '@/i18n/config'
import { translateListing } from '@/lib/content-translation'

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const t = await getT()
  const supabase = await createClient()
  const { data } = await supabase
    .from('offers')
    .select('job:jobs(title)')
    .eq('id', params.id)
    .single()
  const jobTitle = (Array.isArray(data?.job) ? data.job[0] : data?.job)?.title
  return {
    robots: { index: false, follow: false },
    title: jobTitle ? t('Offert – {title}', { title: jobTitle }) : t('Offert'),
    description: t('Se offertdetaljer, acceptera eller avslå offerter och kommunicera med leverantören.'),
  }
}

export default async function OfferPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<{ already?: string }> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const locale = await getLocale()
  const t = await getT()
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  if (!user) redirect(localePath(locale, '/login'))

  const { data: offer } = await supabase
    .from('offers')
    .select('*, provider:users(id, name, bio, avatar_url, skills, hourly_rate), job:jobs(id, title, description, budget, customer_id, customer:users!jobs_customer_id_fkey(id, name))')
    .eq('id', params.id)
    .single()

  if (!offer) notFound()

  const job = Array.isArray(offer.job) ? offer.job[0] : offer.job
  const provider = Array.isArray(offer.provider) ? offer.provider[0] : offer.provider
  // Villkoret läste job.customer?.name medan utskriften normaliserade arrayen.
  // Var relationen en array blev villkoret falskt och kundnamnet försvann helt.
  const rawCustomer = job && (Array.isArray(job.customer) ? job.customer[0] : job.customer)
  const customerName = rawCustomer?.name ?? null
  if (!job) notFound()
  const shownJob = await translateListing('job', job, locale)

  const isCustomer = user.id === job.customer_id
  const isProvider = user.id === offer.provider_id

  // Load existing reviews for this offer
  const { data: reviews } = offer.status === 'completed'
    ? await supabase.from('reviews').select('reviewer_id').eq('offer_id', params.id)
    : { data: [] }

  const hasReviewed = reviews?.some(r => r.reviewer_id === user.id) ?? false

  if (!isCustomer && !isProvider) redirect(localePath(locale, '/'))

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {isCustomer && <MarkOfferRead offerId={offer.id} />}
      {searchParams.already === '1' && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('Du har redan skickat en offert på det här uppdraget. Här är din befintliga offert.')}</span>
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Offer details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={`/jobs/${job.id}`} className="text-sm text-blue-600 hover:underline">
                ← {shownJob.title}
              </Link>
              <h1 className="page-heading mt-2 text-2xl">{t('Offert')}</h1>
            </div>
            <StatusBadge status={offer.status} />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{t('Offertdetaljer')}</h2>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(offer.price, locale)}</p>
                  <p className="text-xs text-gray-400">{offer.price_type === 'fixed' ? t('Fast pris') : t('Per timme')}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{t('Tidsestimat')}</p>
                <p className="text-gray-700">{offer.timeline}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{t('Beskrivning')}</p>
                <LinkifiedText text={offer.description} className="text-gray-700 whitespace-pre-wrap leading-relaxed" />
              </div>
              <p className="text-xs text-gray-400">
                {t('Skickad')} {formatDate(offer.created_at, locale)}
                {offer.edited_at && ` · ${t('Redigerad')} ${formatDate(offer.edited_at, locale)}`}
              </p>
            </CardBody>
          </Card>

          {/* Accept / Reject (only customer, only pending) */}
          {isCustomer && offer.status === 'pending' && (
            <AcceptRejectButtons offerId={offer.id} version={offer.edited_at ?? null} />
          )}

          {/* Provider: ändra en offert som ännu inte besvarats */}
          {isProvider && offer.status === 'pending' && (
            <Link href={`/offers/${offer.id}/edit`} className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:shadow-sm">
              {t('Redigera offert')}
            </Link>
          )}

          {/* Provider: mark as delivered */}
          {isProvider && offer.status === 'accepted' && (
            <MarkDeliveredButton offerId={offer.id} />
          )}

          {/* Customer: confirm completion */}
          {isCustomer && offer.status === 'delivered' && (
            <CompleteJobButton offerId={offer.id} />
          )}

          {/* Review form — visas för båda parter efter completed */}
          {offer.status === 'completed' && !hasReviewed && (
            <WriteReviewForm
              offerId={offer.id}
              revieweeId={isCustomer ? provider.id : job.customer_id}
              revieweeName={isCustomer ? provider.name : customerName ?? t('kunden')}
            />
          )}
          {offer.status === 'completed' && hasReviewed && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('Du har lämnat ett omdöme för det här uppdraget.')}
            </div>
          )}

          {/* Chat link */}
          {(isCustomer || isProvider) && (
            <Link
              href={`/messages/${offer.id}`}
              className={`block w-full text-center text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                offer.status === 'accepted' || offer.status === 'delivered'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {offer.status === 'accepted' || offer.status === 'delivered' ? t('Öppna chatten') : t('Chatta om offerten')}
            </Link>
          )}
        </div>

        {/* Right: Provider info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">{t('Leverantör')}</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Link href={`/profile/${provider.id}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                  {provider.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  {provider.hourly_rate && (
                    <p className="text-xs text-gray-400">{formatCurrency(provider.hourly_rate, locale)}/h</p>
                  )}
                </div>
              </Link>
              {provider.bio && (
                <p className="text-sm text-gray-600">{provider.bio}</p>
              )}
              {provider.skills && provider.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {provider.skills.map((skill: string) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">{t('Uppdrag')}</h3>
            </CardHeader>
            <CardBody>
              <Link href={`/jobs/${job.id}`} className="hover:text-blue-600">
                <p className="font-medium text-gray-900">{shownJob.title}</p>
              </Link>
              {job.budget && (
                <p className="text-sm text-blue-600 mt-1">{t('Budget')}: {formatCurrency(job.budget, locale)}</p>
              )}
              {customerName && (
                <p className="text-xs text-gray-400 mt-2">{t('Kund')}: {customerName}</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
