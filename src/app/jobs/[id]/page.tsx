import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { getCategoryLabel, getCategoryEmoji } from '@/lib/categories'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import CloseJobButton from '@/components/jobs/CloseJobButton'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'
import ApplyForm from '@/components/jobs/ApplyForm'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('title, description').eq('id', params.id).single()
  return {
    title: data?.title ? `${data.title} – Jobb i Göteborg` : 'Jobb',
    description: data?.description?.slice(0, 155) ?? 'Sök jobb i Göteborg på Prolink.',
  }
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, customer:users(id, name, bio, avatar_url)')
    .eq('id', params.id)
    .single()

  if (!job) notFound()

  const isOwner = user?.id === job.customer_id

  const applicantProfile = user && !isOwner
    ? await supabase
        .from('users')
        .select('id, name, avatar_url, phone, bio, cv_text, cv_url')
        .eq('id', user.id)
        .single()
        .then(r => r.data)
    : null

  const userHasApplied = user && !isOwner
    ? !!(await supabase
        .from('applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('applicant_email', user.email!)
        .maybeSingle()
        .then(r => r.data))
    : false

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{getCategoryEmoji(job.category)}</span>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-2 flex-wrap">
              <span className="font-medium">{job.employer_name || job.customer?.name}</span>
              {job.location && <><span>·</span><span>📍 {job.location}</span></>}
              <span>·</span>
              <span>{formatDate(job.created_at)}</span>
              {job.salary && (
                <><span>·</span><span className="font-semibold text-blue-600">{job.salary}</span></>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-6">
              {job.category && (
                <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  {getCategoryLabel(job.category)}
                </span>
              )}
              {job.work_type && (
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                  {job.work_type}
                </span>
              )}
            </div>

            <Card>
              <CardBody>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </CardBody>
            </Card>

            {job.contact_info && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Kontakt</p>
                <p className="text-sm text-gray-700 font-medium">{job.contact_info}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Detaljer */}
          {(job.salary || job.work_type || job.location) && (
            <Card>
              <CardHeader><h3 className="font-semibold text-gray-900">Detaljer</h3></CardHeader>
              <CardBody className="space-y-3">
                {job.salary && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Lön</p>
                    <p className="text-sm font-semibold text-gray-900">{job.salary}</p>
                  </div>
                )}
                {job.work_type && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Arbetstid</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{job.work_type}</p>
                  </div>
                )}
                {job.location && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Område</p>
                    <p className="text-sm font-semibold text-gray-900">{job.location}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Ansök / ägar-kontroller */}
          {isOwner ? (
            <Card>
              <CardBody className="space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-amber-800">Det här är ditt jobb</p>
                </div>
                <Link
                  href={`/jobs/${job.id}/applications`}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Se ansökningar
                </Link>
                {job.status === 'open' && <CloseJobButton jobId={job.id} />}
                <DeleteJobButton jobId={job.id} />
              </CardBody>
            </Card>
          ) : job.status !== 'open' ? (
            <Card>
              <CardBody className="text-center">
                <p className="text-sm text-gray-500 font-medium">Det här jobbet är inte längre aktivt.</p>
                <Link href="/jobs" className="mt-3 inline-flex text-sm text-blue-600 font-semibold hover:underline">
                  Se andra jobb →
                </Link>
              </CardBody>
            </Card>
          ) : userHasApplied ? (
            <Card>
              <CardBody className="text-center space-y-2">
                <p className="text-2xl">✅</p>
                <p className="font-bold text-green-800">Du har ansökt!</p>
                <p className="text-sm text-green-600">Arbetsgivaren hör av sig inom kort.</p>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader><h3 className="font-semibold text-gray-900">Ansök nu</h3></CardHeader>
              <CardBody>
                <ApplyForm jobId={job.id} profile={applicantProfile ?? null} />
              </CardBody>
            </Card>
          )}
        </div>

      </div>
    </div>
  )
}
