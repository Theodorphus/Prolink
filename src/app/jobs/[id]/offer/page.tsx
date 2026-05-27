import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateOfferForm from '@/components/offers/CreateOfferForm'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Skicka offert',
  description: 'Skicka en offert på ett uppdrag på Prolink.',
}

export default async function CreateOfferPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/jobs/${params.id}/offer`)

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'provider') redirect(`/jobs/${params.id}`)

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, description, budget, status')
    .eq('id', params.id)
    .single()

  if (!job) notFound()
  if (job.status !== 'open') redirect(`/jobs/${params.id}`)

  // Förhindra dubbla offerter
  const { data: existing } = await supabase
    .from('offers')
    .select('id')
    .eq('job_id', params.id)
    .eq('provider_id', user.id)
    .single()

  if (existing) redirect(`/offers/${existing.id}?already=1`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Skicka offert</h1>

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardBody>
          <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Uppdrag</p>
          <p className="font-semibold text-gray-900">{job.title}</p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{job.description}</p>
          {job.budget && (
            <p className="text-sm text-blue-600 font-medium mt-2">Budget: {formatCurrency(job.budget)}</p>
          )}
        </CardBody>
      </Card>

      <CreateOfferForm jobId={job.id} />
    </div>
  )
}
