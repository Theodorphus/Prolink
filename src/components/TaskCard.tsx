import Link from 'next/link'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { Job, User } from '@/types/database'

type CategoryKey =
  | 'design'
  | 'webb'
  | 'webb-design'
  | 'utveckling'
  | 'marknad'
  | 'marknadsföring'
  | 'text'
  | 'copywriting'
  | 'foto'
  | 'video'
  | 'ekonomi'
  | 'juridik'
  | 'it'
  | 'support'
  | 'bygg'
  | 'översättning'
  | 'annat'

function CategoryIcon({ category }: { category?: string | null }) {
  const key = category?.toLowerCase() as CategoryKey | undefined

  if (key?.includes('design') || key?.includes('webb-design')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
  if (key?.includes('webb') || key?.includes('utveckling') || key?.includes('it')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  }
  if (key?.includes('marknad') || key?.includes('marknadsföring')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    )
  }
  if (key?.includes('text') || key?.includes('copywriting')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    )
  }
  if (key?.includes('foto') || key?.includes('video')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  }
  if (key?.includes('ekonomi')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
  if (key?.includes('juridik')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    )
  }
  if (key?.includes('bygg')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }
  if (key?.includes('översättning')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    )
  }
  // Default
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

export interface TaskCardJob extends Job {
  customer: Pick<User, 'name' | 'avatar_url'>
  offer_count?: number
}

interface TaskCardProps {
  job: TaskCardJob
}

export default function TaskCard({ job }: TaskCardProps) {
  const offerCount = job.offer_count ?? 0
  const hasBudget = job.budget !== null && job.budget > 0

  return (
    <Link href={`/jobs/${job.id}`} className="group block h-full">
      <article className="bg-white border border-neutral-200 rounded-2xl p-5 h-full flex flex-col gap-4 hover:shadow-lg hover:scale-[1.02] hover:border-neutral-300 transition-all duration-200">

        {/* Top row: category icon + budget badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CategoryIcon category={job.category} />
            </div>
            {job.category && (
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate max-w-[120px]">
                {job.category}
              </span>
            )}
          </div>

          {hasBudget ? (
            <span className="shrink-0 inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
              {formatCurrency(job.budget!)}
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-100">
              Öppen budget
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-neutral-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
          {job.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2 flex-1">
          {job.description}
        </p>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex flex-col gap-3">
          {/* Author + time */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {job.customer?.avatar_url ? (
                <img
                  src={job.customer.avatar_url}
                  alt={job.customer.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {job.customer?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="text-xs font-medium text-neutral-600 truncate">
                {job.customer?.name ?? 'Anonym'}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 shrink-0">
              {timeAgo(job.created_at)}
            </span>
          </div>

          {/* Offer count badge + CTA */}
          <div className="flex items-center justify-between gap-2">
            {offerCount === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                0 offerter – stor chans!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {offerCount} {offerCount === 1 ? 'offert' : 'offerter'} inkomna
              </span>
            )}

            <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-1 transition-colors shrink-0">
              Visa uppdrag
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
