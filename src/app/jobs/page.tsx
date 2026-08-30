import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import JobFilters from '@/components/jobs/JobFilters'
import { getCategoryLabel, getCategoryEmoji } from '@/lib/categories'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'

export const metadata = {
  title: 'Jobb i Göteborg – Städ, café, restaurang, lager & mer',
  description: 'Bläddra bland lediga jobb i Göteborg. Ansök direkt med din profil.',
}

interface Props {
  searchParams: { q?: string; sort?: string; category?: string; worktype?: string }
}

export default async function JobsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { q, sort = 'newest', category, worktype } = searchParams

  let query = supabase
    .from('jobs')
    .select(PUBLIC_JOB_FIELDS)
    .eq('status', 'open')

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  if (category) query = query.eq('category', category)
  if (worktype) query = query.eq('work_type', worktype)

  query = sort === 'oldest'
    ? query.order('created_at', { ascending: true })
    : query.order('created_at', { ascending: false })

  const { data: jobs, error } = await query

  if (error) {
    console.error('Kunde inte hämta uppdrag:', error.message)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobb i Göteborg</h1>
          <p className="text-gray-600 mt-1">{jobs?.length ?? 0} lediga jobb</p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Lägg upp jobb
        </Link>
      </div>

      <Suspense>
        <JobFilters />
      </Suspense>

      <div className="space-y-4">
        {jobs?.map((job: any) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
            <div className="bg-white border border-neutral-300 rounded-2xl p-6 hover:border-neutral-500 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{getCategoryEmoji(job.category)}</span>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                    <span className="font-medium">{job.employer_name || job.customer?.name}</span>
                    {job.location && <><span>·</span><span>📍 {job.location}</span></>}
                    <span>·</span>
                    <span>{formatDate(job.created_at)}</span>
                    {job.category && (
                      <span className="bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                        {getCategoryLabel(job.category)}
                      </span>
                    )}
                    {job.work_type && (
                      <span className="bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full capitalize">
                        {job.work_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {job.salary ? (
                    <>
                      <p className="font-semibold text-blue-600 text-lg">{job.salary}</p>
                      <p className="text-xs text-gray-400">lön</p>
                    </>
                  ) : (
                    <span className="text-sm bg-neutral-100 text-neutral-600 font-medium px-2.5 py-1 rounded-lg">
                      Enl. ök.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {(!jobs || jobs.length === 0) && (
          <div className="text-center py-16 text-gray-500">
            {q ? (
              <p className="text-lg">Inga jobb matchade &ldquo;{q}&rdquo;.</p>
            ) : (
              <>
                <p className="text-lg">Inga öppna jobb just nu.</p>
                <Link href="/jobs" className="mt-4 inline-flex text-sm text-blue-600 font-medium hover:underline">
                  ← Rensa filter
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
