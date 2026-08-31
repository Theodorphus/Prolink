import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { formatCurrency, formatDate } from '@/lib/utils'
import JobFilters from '@/components/jobs/JobFilters'
import { getCategoryLabel, getCategoryEmoji } from '@/lib/categories'

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
          <Link key={job.id} href={`/jobs/${job.id}`} className="group block">
            <article className="surface surface-interactive p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-2.5 flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl"
                      aria-hidden
                    >
                      {getCategoryEmoji(job.category)}
                    </span>
                    <h2 className="truncate text-lg font-bold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
                      {job.title}
                    </h2>
                  </div>
                  <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    {job.category && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                        {getCategoryLabel(job.category)}
                      </span>
                    )}
                    {job.work_type && (
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600 ring-1 ring-inset ring-slate-200">
                        {job.work_type}
                      </span>
                    )}
                    {job.location && (
                      <span className="text-xs font-medium text-slate-500">{job.location}</span>
                    )}
                  </div>

                  {/* Avsändare och datum är sekundärt och skiljs av en linje så
                      det inte konkurrerar med uppdragets innehåll. */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-3.5 text-xs font-medium text-slate-500">
                    <span>{job.customer?.name ?? 'Prolink-kund'}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(job.created_at)}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {job.budget ? (
                    <>
                      <p className="text-lg font-black tracking-[-0.02em] text-slate-900">
                        {formatCurrency(job.budget)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">budget</p>
                    </>
                  ) : (
                    <span className="inline-flex rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                      Öppen budget
                    </span>
                  )}
                </div>
              </div>
            </article>
          </Link>
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
