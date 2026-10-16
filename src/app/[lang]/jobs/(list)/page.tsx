import Pagination from '@/components/ui/Pagination'
import { pageNumber, PAGE_SIZE } from '@/lib/pagination'
import Link from '@/components/i18n/Link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import JobFilters from '@/components/jobs/JobFilters'
import JobCard from '@/components/jobs/JobCard'
import { searchTerm } from '@/lib/validation'
import { pageMetadata } from '@/lib/seo'
import { getLocale, getT } from '@/i18n/server'
import { translateListings } from '@/lib/content-translation'

export async function generateMetadata() {
  const t = await getT()
  return pageMetadata({
    title: t('Hitta frilansuppdrag'),
    description: t('Bläddra bland öppna uppdrag inom webb, design, marknadsföring, redovisning och IT, och lämna offert direkt.'),
    path: '/jobs',
    locale: await getLocale(),
  })
}

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; category?: string; worktype?: string }>
}

export default async function JobsPage(props: Props) {
  const searchParams = await props.searchParams;
  const locale = await getLocale()
  const t = await getT()
  const page = pageNumber(searchParams.page)
  const supabase = await createClient()
  const { q, sort = 'newest', category, worktype } = searchParams

  let query = supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users!jobs_customer_id_fkey(name)`, { count: 'exact' })
    .eq('status', 'open')

  const safeQuery = searchTerm(q)
  if (safeQuery) query = query.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
  if (category) query = query.eq('category', category)
  if (worktype) query = query.eq('work_type', worktype)

  query = sort === 'oldest'
    ? query.order('created_at', { ascending: true })
    : query.order('created_at', { ascending: false })

  const { data: jobs, count, error } = await query.order('id', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw new Error('Listan kunde inte hämtas. Försök igen.')
  const shown = await translateListings('job', jobs ?? [], locale)

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="page-eyebrow">{t('Uppdrag')}</p>
          <h1 className="page-heading mt-2.5 text-3xl sm:text-4xl">{t('Hitta uppdrag')}</h1>
          <p className="muted mt-2 text-sm font-medium">
            {t('{count} {label} just nu', { count: count ?? 0, label: count === 1 ? t('öppet uppdrag') : t('öppna uppdrag') })}
          </p>
        </div>
        <Link
          href="/jobs/create"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/25"
        >
          {t('Publicera uppdrag')}
        </Link>
      </div>

      <Suspense>
        <JobFilters />
      </Suspense>

      <div className="mt-7 space-y-3.5">
        {shown.map((job) => (
          <JobCard key={job.id} job={{ ...job, customer: Array.isArray(job.customer) ? job.customer[0] : job.customer }} variant="row" />
        ))}

        {(!jobs || jobs.length === 0) && (
          <div className="surface px-6 py-20 text-center">
            {q ? (
              <>
                <p className="text-lg font-bold text-slate-900">
                  {t('Inga uppdrag matchade')} &rdquo;{q}&rdquo;
                </p>
                <p className="muted mx-auto mt-2 max-w-sm text-sm">
                  {t('Prova ett bredare sökord eller rensa filtren.')}
                </p>
                <Link
                  href="/jobs"
                  className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  {t('Rensa filter')}
                </Link>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-900">{t('Inga öppna uppdrag just nu')}</p>
                <p className="muted mx-auto mt-2 max-w-sm text-sm">
                  {t('Är du först ut? Publicera ett uppdrag och få offerter från frilansare.')}
                </p>
                <Link
                  href="/jobs/create"
                  className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
                >
                  {t('Publicera uppdrag')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} pathname="/jobs" params={searchParams} />
    </div>
  )
}
