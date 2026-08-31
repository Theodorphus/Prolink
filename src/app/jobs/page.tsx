import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import JobFilters from '@/components/jobs/JobFilters'
import JobCard from '@/components/jobs/JobCard'

export const metadata = {
  title: 'Hitta frilansuppdrag',
  description: 'Bläddra bland öppna uppdrag inom webb, design, marknadsföring, redovisning och IT.',
}

interface Props {
  searchParams: Promise<{ q?: string; sort?: string; category?: string; worktype?: string }>
}

export default async function JobsPage(props: Props) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { q, sort = 'newest', category, worktype } = searchParams

  let query = supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users(name)`)
    .eq('status', 'open')

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  if (category) query = query.eq('category', category)
  if (worktype) query = query.eq('work_type', worktype)

  query = sort === 'oldest'
    ? query.order('created_at', { ascending: true })
    : query.order('created_at', { ascending: false })

  const { data: jobs } = await query

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="page-eyebrow">Uppdrag</p>
          <h1 className="page-heading mt-2.5 text-3xl sm:text-4xl">Hitta uppdrag</h1>
          <p className="muted mt-2 text-sm font-medium">
            {jobs?.length ?? 0} {jobs?.length === 1 ? 'öppet uppdrag' : 'öppna uppdrag'} just nu
          </p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/25"
        >
          Publicera uppdrag
        </Link>
      </div>

      <Suspense>
        <JobFilters />
      </Suspense>

      <div className="mt-7 space-y-3.5">
        {jobs?.map((job: any) => (
          <JobCard key={job.id} job={job} variant="row" />
        ))}

        {(!jobs || jobs.length === 0) && (
          <div className="surface px-6 py-20 text-center">
            {q ? (
              <>
                <p className="text-lg font-bold text-slate-900">
                  Inga uppdrag matchade &ldquo;{q}&rdquo;
                </p>
                <p className="muted mx-auto mt-2 max-w-sm text-sm">
                  Prova ett bredare sökord eller rensa filtren.
                </p>
                <Link
                  href="/jobs"
                  className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  Rensa filter
                </Link>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-900">Inga öppna uppdrag just nu</p>
                <p className="muted mx-auto mt-2 max-w-sm text-sm">
                  Är du först ut? Publicera ett uppdrag och få offerter från frilansare.
                </p>
                <Link
                  href="/jobs/create"
                  className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                >
                  Publicera uppdrag
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
