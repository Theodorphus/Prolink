import { getCategoryEmoji, getCategoryLabel } from '@/lib/categories'

export interface SwipeJob {
  id: string
  title: string
  description: string
  salary: string | null
  location: string | null
  work_type: string | null
  employer_name: string | null
  category: string | null
}

export default function JobSwipeCard({ job }: { job: SwipeJob }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">
      <div className="relative flex h-40 shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
        <span className="text-6xl drop-shadow-lg" aria-hidden>
          {getCategoryEmoji(job.category)}
        </span>
        {job.category && (
          <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {getCategoryLabel(job.category)}
          </span>
        )}
        {job.salary && (
          <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-bold text-neutral-900 shadow-sm">
            {job.salary}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="text-2xl font-bold leading-tight tracking-tight text-neutral-900 line-clamp-2">
          {job.title}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
          {job.employer_name && <span>{job.employer_name}</span>}
          {job.location && (
            <>
              {job.employer_name && <span>·</span>}
              <span>📍 {job.location}</span>
            </>
          )}
          {job.work_type && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 capitalize text-neutral-600">
              {job.work_type}
            </span>
          )}
        </div>

        <p className="mt-4 flex-1 overflow-hidden text-sm leading-relaxed text-neutral-600 line-clamp-[7]">
          {job.description}
        </p>

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
          Tryck för detaljer
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  )
}
