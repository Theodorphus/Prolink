import { unstable_cache } from 'next/cache'
import Link from '@/components/i18n/Link'
import { createPublicClient } from '@/lib/supabase/public'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/categories'
import CategoryThumb from '@/components/ui/CategoryThumb'
import type { PublicJob, User } from '@/types/database'
import { PUBLIC_JOBS_TAG } from '@/lib/revalidate'
import { getLocale, getT } from '@/i18n/server'
import { translateListings } from '@/lib/content-translation'

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

const latestJobs = unstable_cache(async () => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users!jobs_customer_id_fkey(name)`)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) throw new Error('Uppdragen kunde inte hämtas.')
  return data
}, ['public-latest-jobs'], { revalidate: 60, tags: [PUBLIC_JOBS_TAG] })

export default async function LatestJobs() {
  const locale = await getLocale()
  const t = await getT()
  let data
  try { data = await latestJobs() }
  catch { return <p className="mt-6 text-sm text-slate-500">{t('Uppdragen kunde inte hämtas.')} <Link href="/jobs" className="underline">{t('Försök igen')}</Link></p> }
  // Supabase typar den inbäddade relationen som en array eftersom FK-relationen
  // saknas i de handunderhållna typerna. Varje uppdrag har exakt en kund.
  const jobs: FeaturedJob[] = (data ?? []).map(row => ({
    ...row,
    customer: Array.isArray(row.customer) ? row.customer[0] ?? null : row.customer,
  })) as FeaturedJob[]

  if (jobs.length === 0) return null
  const shown = await translateListings('job', jobs, locale)

  return (
    <div className="mt-11">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((job, index) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            // Bara två uppdrag på mobil, tre från lg, för att hålla sidan kort.
            className={`group block ${index >= 2 ? 'hidden lg:block' : ''}`}
          >
            <article className="gradient-border surface surface-interactive flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <CategoryThumb category={job.category} size={44} className="transition-transform duration-300 group-hover:scale-110" />
                <span
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{ background: 'var(--teal-tint)', color: 'var(--teal-deep)' }}
                >
                  {job.budget ? formatCurrency(job.budget, locale) : t('Öppen budget')}
                </span>
              </div>

              {job.category && (
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {getCategoryLabel(job.category, t)}
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
                  {job.customer?.name ?? t('Prolink-kund')} · {timeAgo(job.created_at, locale)}
                </span>
                <span className="shrink-0 text-indigo-600 transition-transform duration-200 group-hover:translate-x-0.5">
                  {t('Visa uppdrag →')}
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
        {t('Alla uppdrag →')}
      </Link>
    </div>
  )
}
