import { notFound, redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import CreateOfferForm from '@/components/offers/CreateOfferForm'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { getLocale, getT } from '@/i18n/server'
import { localePath } from '@/i18n/config'
import { translateListing } from '@/lib/content-translation'

export async function generateMetadata() {
  const t = await getT()
  return {
    title: t('Skicka offert'),
    description: t('Skicka en offert på ett uppdrag på Prolink.'),
  }
}

export default async function CreateOfferPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const locale = await getLocale()
  const t = await getT()
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  if (!user) redirect(localePath(locale, `/login?redirect=/jobs/${params.id}/offer`))

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'provider') redirect(localePath(locale, `/jobs/${params.id}`))

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, description, budget, status')
    .eq('id', params.id)
    .single()

  if (!job) notFound()
  if (job.status !== 'open') redirect(localePath(locale, `/jobs/${params.id}`))

  // Förhindra dubbla offerter. maybeSingle() i stället för single(), som
  // loggar ett fel när ingen rad finns — vilket är det normala fallet här.
  const { data: existing } = await supabase
    .from('offers')
    .select('id')
    .eq('job_id', params.id)
    .eq('provider_id', user.id)
    .maybeSingle()

  const shown = await translateListing('job', job, locale)

  if (existing) redirect(localePath(locale, `/offers/${existing.id}?already=1`))

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="page-heading mb-2 text-2xl">{t('Skicka offert')}</h1>

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardBody>
          <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">{t('Uppdrag')}</p>
          <p className="font-semibold text-gray-900">{shown.title}</p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{shown.description}</p>
          {job.budget && (
            <p className="text-sm text-blue-600 font-medium mt-2">{t('Budget')}: {formatCurrency(job.budget, locale)}</p>
          )}
        </CardBody>
      </Card>

      <CreateOfferForm jobId={job.id} />
    </div>
  )
}
