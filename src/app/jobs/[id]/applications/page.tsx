import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Card, CardBody } from '@/components/ui/Card'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('title').eq('id', params.id).single()
  return { title: data?.title ? `Ansökningar – ${data.title}` : 'Ansökningar' }
}

export default async function ApplicationsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/jobs/${params.id}/applications`)

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, customer_id, status')
    .eq('id', params.id)
    .single()

  if (!job) notFound()
  if (job.customer_id !== user.id) redirect(`/jobs/${params.id}`)

  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href={`/jobs/${params.id}`} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          ← Tillbaka till annonsen
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">{job.title}</h1>
        <p className="text-gray-500 mt-1">
          {applications?.length ?? 0} ansökning{applications?.length !== 1 ? 'ar' : ''}
        </p>
      </div>

      {(!applications || applications.length === 0) ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Inga ansökningar än</p>
          <p className="text-sm mt-1">Dela annonsen för att nå fler sökande.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card key={app.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{app.applicant_name}</p>
                    <p className="text-sm text-gray-500">{formatDate(app.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-sm">
                    <a href={`mailto:${app.applicant_email}`}
                      className="text-blue-600 font-medium hover:underline">
                      {app.applicant_email}
                    </a>
                    {app.applicant_phone && (
                      <a href={`tel:${app.applicant_phone}`}
                        className="text-gray-600 hover:text-gray-900">
                        {app.applicant_phone}
                      </a>
                    )}
                  </div>
                </div>

                {app.message && (
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">
                    {app.message}
                  </p>
                )}

              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
