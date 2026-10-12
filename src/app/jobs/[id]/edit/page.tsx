import { notFound, redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { isUuid } from '@/lib/validation'
import EditJobForm from '@/components/jobs/EditJobForm'

export const metadata = { title: 'Redigera uppdrag', robots: { index: false, follow: false } }

export default async function EditJobPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  if (!isUuid(id)) notFound()
  const { data: { user } } = await getUser()
  if (!user) redirect(`/login?redirect=/jobs/${id}/edit`)

  const supabase = await createClient()
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, customer_id, title, description, category, budget, location, work_type, status, archived_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Uppdraget kunde inte hämtas.')
  if (!job || job.customer_id !== user.id) notFound()
  // Databasen nekar redigering av stängda uppdrag; sidan visar då uppdraget i stället.
  if (job.status !== 'open' || job.archived_at) redirect(`/jobs/${id}`)

  const { count: offerCount } = await supabase
    .from('offers')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Redigera uppdrag</h1>
        <p className="text-gray-500">Ändringarna syns direkt för alla som besöker uppdraget.</p>
      </div>
      {offerCount ? (
        <div role="note" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {offerCount === 1 ? 'En leverantör har' : `${offerCount} leverantörer har`} redan lämnat offert utifrån den nuvarande beskrivningen.
          Uppdraget märks som redigerat, men stämmer en offert inte längre kan du skriva till leverantören i chatten.
        </div>
      ) : null}
      <EditJobForm
        jobId={job.id}
        defaults={{
          title: job.title,
          description: job.description,
          category: job.category ?? undefined,
          budget: job.budget ? String(job.budget) : undefined,
          location: job.location ?? undefined,
          work_type: job.work_type ?? undefined,
        }}
      />
    </div>
  )
}
