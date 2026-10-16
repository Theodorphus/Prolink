import { notFound, redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { isUuid } from '@/lib/validation'
import CreateOfferForm from '@/components/offers/CreateOfferForm'
import { getLocale, getT } from '@/i18n/server'
import { localePath } from '@/i18n/config'

export async function generateMetadata() {
  return { title: (await getT())('Redigera offert'), robots: { index: false, follow: false } }
}

export default async function EditOfferPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  if (!isUuid(id)) notFound()
  const locale = await getLocale()
  const t = await getT()
  const { data: { user } } = await getUser()
  if (!user) redirect(localePath(locale, `/login?redirect=/offers/${id}/edit`))

  const supabase = await createClient()
  const { data: offer, error } = await supabase
    .from('offers')
    .select('id, job_id, provider_id, price, price_type, timeline, description, status, job:jobs(title, status)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Offerten kunde inte hämtas.')
  if (!offer || offer.provider_id !== user.id) notFound()
  const job = Array.isArray(offer.job) ? offer.job[0] : offer.job
  // Databasen nekar redigering av offerter som besvarats eller vars uppdrag stängts.
  if (offer.status !== 'pending' || job?.status !== 'open') redirect(localePath(locale, `/offers/${id}`))

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="page-heading mb-2 text-2xl">{t('Redigera offert')}</h1>
      <p className="text-gray-600 mb-6">
        {t('Kunden får ett mejl om att offerten uppdaterats och måste läsa den nya versionen innan hen kan acceptera.')}
      </p>
      <CreateOfferForm
        jobId={offer.job_id}
        edit={{
          offerId: offer.id,
          defaults: {
            price: String(offer.price),
            price_type: offer.price_type,
            timeline: offer.timeline,
            description: offer.description,
          },
        }}
      />
    </div>
  )
}
