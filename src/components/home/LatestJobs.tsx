import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { getCategoryEmoji, getCategoryLabel } from '@/lib/categories'
import type { PublicJob, User } from '@/types/database'

type FeaturedJob = PublicJob & { customer: Pick<User, 'name'> | null }

/** Skelett som visas medan serverkomponenten hämtar uppdragen. */
export function LatestJobsSkeleton() {
  return (
    <div className="mt-11 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map(i => (
        <div key={i} className={`surface p-6 ${i >= 2 ? 'hidden lg:block' : ''} ${i >= 1 ? 'hidden md:block' : ''}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="skeleton h-11 w-11 rounded-xl" />
            <div className="skeleton h-7 w-24 rounded-full" />
          </div>
          <div className="skeleton mt-6 h-3 w-24 rounded" />
          <div className="skeleton mt-3 h-5 w-full rounded" />
          <div className="skeleton mt-2 h-5 w-3/4 rounded" />
          <div className="skeleton mt-4 h-3 w-full rounded" />
          <div className="skeleton mt-2 h-3 w-5/6 rounded" />
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function LatestJobs() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users(name)`)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  // Supabase typar den inbäddade relationen som en array eftersom FK-relationen
  // saknas i de handunderhållna typerna. Varje uppdrag har exakt en kund.
  const jobs: FeaturedJob[] = (data ?? []).map(row => ({
    ...row,
    customer: Array.isArray(row.customer) ? row.customer[0] ?? null : row.customer,
  })) as FeaturedJob[]

  if (jobs.length === 0) return null

  return (
    <div className="mt-11">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job, index) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            // Bara två uppdrag på mobil, tre från lg, för att hålla sidan kort.
            className={`group block ${index >= 2 ? 'hidden lg:block' : ''}`}
          >
            <article className="gradient-border surface surface-interactive flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'var(--accent-tint)' }}
                  aria-hidden
                >
                  {getCategoryEmoji(job.category)}
                </span>
                <span
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{ background: 'var(--teal-tint)', color: 'var(--teal-deep)' }}
                >
                  {job.budget ? formatCurrency(job.budget) : 'Öppen budget'}
                </span>
              </div>

              {job.category && (
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {getCategoryLabel(job.category)}
                </p>
              )}

              <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug tracking-[-0.025em] text-slate-900 transition-colors group-hover:text-indigo-600">
                {job.title}
              </h3>

              <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-slate-600">
                {job.description}
              </p>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold">
                <span className="truncate text-slate-500">
                  {job.customer?.name ?? 'Prolink-kund'} · {timeAgo(job.created_at)}
                </span>
                <span className="shrink-0 text-indigo-600 transition-transform duration-200 group-hover:translate-x-0.5">
                  Visa uppdrag →
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Samma länk behövs på mobil, där rubrikens länk är dold. */}
      <Link
        href="/jobs"
        className="mt-6 flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:hidden"
      >
        Alla uppdrag →
      </Link>
    </div>
  )
}
