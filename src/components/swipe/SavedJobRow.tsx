'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { getCategoryEmoji, getCategoryLabel } from '@/lib/categories'
import { unsaveJob } from '@/lib/actions/saved-jobs'
import type { SwipeJob } from './JobSwipeCard'

const SAVED_KEY = 'prolink:saved-jobs'

function removeLocal(id: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids.filter((x) => x !== id)))
  } catch {
    /* ignore */
  }
}

export default function SavedJobRow({
  job,
  isAuthed,
  onRemoved,
}: {
  job: SwipeJob
  isAuthed: boolean
  onRemoved?: (id: string) => void
}) {
  const [removed, setRemoved] = useState(false)
  const [pending, startTransition] = useTransition()

  if (removed) return null

  function handleRemove() {
    removeLocal(job.id)
    if (isAuthed) {
      startTransition(async () => {
        await unsaveJob(job.id)
        setRemoved(true)
        onRemoved?.(job.id)
      })
    } else {
      setRemoved(true)
      onRemoved?.(job.id)
    }
  }

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-neutral-300 bg-white p-5 transition-all hover:border-neutral-500 hover:shadow-md">
      <span className="text-2xl shrink-0">{getCategoryEmoji(job.category)}</span>

      <Link href={`/jobs/${job.id}`} className="group min-w-0 flex-1">
        <h3 className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {job.title}
        </h3>
        <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{job.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          {job.employer_name && <span className="font-medium">{job.employer_name}</span>}
          {job.location && <span>📍 {job.location}</span>}
          {job.category && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
              {getCategoryLabel(job.category)}
            </span>
          )}
          {job.salary && (
            <span className="rounded-lg bg-neutral-100 px-2 py-0.5 font-bold text-neutral-900">{job.salary}</span>
          )}
        </div>
      </Link>

      <button
        onClick={handleRemove}
        disabled={pending}
        aria-label="Ta bort från sparade"
        className="shrink-0 rounded-full p-2 text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
