'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SavedJobRow from './SavedJobRow'
import type { SwipeJob } from './JobSwipeCard'

const SAVED_KEY = 'prolink:saved-jobs'

function readLocalIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function SavedJobsLocal() {
  const [jobs, setJobs] = useState<SwipeJob[] | null>(null)

  useEffect(() => {
    const ids = readLocalIds()
    if (ids.length === 0) {
      setJobs([])
      return
    }
    const supabase = createClient()
    supabase
      .from('jobs')
      .select('id, title, description, salary, location, work_type, employer_name, category')
      .in('id', ids)
      .eq('status', 'open')
      .then(({ data }) => {
        const rows = (data ?? []) as SwipeJob[]
        // preserve saved order (most recently saved last in localStorage → show first)
        const ordered = [...ids].reverse().map((id) => rows.find((r) => r.id === id)).filter(Boolean) as SwipeJob[]
        setJobs(ordered)
      })
  }, [])

  if (jobs === null) {
    return <p className="py-16 text-center text-sm text-neutral-400">Laddar…</p>
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 bg-white py-16 text-center">
        <span className="text-4xl">🔖</span>
        <h2 className="mt-4 text-lg font-bold text-neutral-900">Inga sparade jobb än</h2>
        <p className="mt-1 text-sm text-neutral-500">Swipa höger på jobb du gillar så hamnar de här.</p>
        <Link href="/swipe" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
          Börja swipa →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <SavedJobRow key={job.id} job={job} isAuthed={false} />
      ))}
    </div>
  )
}
