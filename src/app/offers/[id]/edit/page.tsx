import { notFound, redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { isUuid } from '@/lib/validation'
import CreateOfferForm from '@/components/offers/CreateOfferForm'

export const metadata = { title: 'Redigera offert', robots: { index: false, follow: false } }

export default async function EditOfferPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  if (!isUuid(id)) notFound()
  const { data: { user } } = await getUser()
  if (!user) redirect(`/login?redirect=/offers/${id}/edit`)

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
  if (offer.status !== 'pending' || job?.status !== 'open') redirect(`/offers/${id}`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="page-heading mb-2 text-2xl">Redigera offert</h1>
      <p className="text-gray-600 mb-6">
        Kunden får ett mejl om att offerten uppdaterats och måste läsa den nya versionen innan hen kan acceptera.
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
