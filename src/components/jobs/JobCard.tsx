import Link from '@/components/i18n/Link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/categories'
import CategoryThumb from '@/components/ui/CategoryThumb'
import { getLocale, getT } from '@/i18n/server'

export interface JobCardJob {
  id: string
  title: string
  description: string
  budget: number | null
  status?: string | null
  category: string | null
  location: string | null
  work_type: string | null
  created_at: string
  customer?: { name: string } | null
  /** Antal inkomna offerter. Utelämnas när siffran inte kan hämtas säkert. */
  offerCount?: number | null
}

/**
 * Gemensamt uppdragskort. Används på startsidan och i uppdragslistan så att
 * kategorietikett, budget, datum och avsändare presenteras likadant överallt.
 *
 * `variant` styr bara täthet: listan har mer horisontellt utrymme än rutnätet
 * på startsidan.
 */
export default async function JobCard({
  job,
  variant = 'grid',
}: {
  job: JobCardJob
  variant?: 'grid' | 'row'
}) {
  const locale = await getLocale()
  const t = await getT()
  const workType =
    job.work_type === 'remote'
      ? t('På distans')
      : job.work_type === 'onsite'
        ? t('På plats')
        : job.work_type === 'hybrid'
          ? t('Hybrid')
          : null

  const budget = job.budget ? formatCurrency(job.budget, locale) : t('Öppen budget')

  if (variant === 'row') {
    return (
      <Link href={`/jobs/${job.id}`} className="group block">
        <article className="surface surface-interactive p-6">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex items-center gap-3">
                <CategoryThumb category={job.category} size={40} />
                <h3 className="truncate text-lg font-bold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
                  {job.title}
                </h3>
              </div>

              <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>

              <div className="flex flex-wrap items-center gap-2">
                {job.category && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                    {getCategoryLabel(job.category, t)}
                  </span>
                )}
                {workType && (
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                    {workType}
                  </span>
                )}
                {job.location && (
                  <span className="text-xs font-medium text-slate-500">{job.location}</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-3.5 text-xs font-medium text-slate-500">
                <span>{job.customer?.name ?? t('Prolink-kund')}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(job.created_at, locale)}</span>
                {typeof job.offerCount === 'number' && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {job.offerCount} {job.offerCount === 1 ? t('offert') : t('offerter')}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              {job.budget ? (
                <>
                  <p className="text-lg font-black tracking-[-0.02em] text-slate-900">{budget}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">{t('budget')}</p>
                </>
              ) : (
                <span className="inline-flex rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                  {t('Öppen budget')}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/jobs/${job.id}`} className="group block h-full">
      <article className="surface surface-interactive flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <CategoryThumb category={job.category} size={40} />
          <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200">
            {budget}
          </span>
        </div>

        {job.category && (
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-700">
            {getCategoryLabel(job.category, t)}
          </p>
        )}

        <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
          {job.title}
        </h3>

        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-slate-600">{job.description}</p>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
          <span className="truncate">{job.customer?.name ?? t('Prolink-kund')}</span>
          <span className="shrink-0 text-blue-700">{t('Visa uppdrag →')}</span>
        </div>
      </article>
    </Link>
  )
}
