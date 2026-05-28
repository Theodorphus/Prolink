import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SavedJobRow from '@/components/swipe/SavedJobRow'
import SavedJobsLocal from '@/components/swipe/SavedJobsLocal'
import SyncSavedOnLoad from '@/components/swipe/SyncSavedOnLoad'
import type { SwipeJob } from '@/components/swipe/JobSwipeCard'

export const metadata = {
  title: 'Sparade jobb – Prolink',
  description: 'Dina sparade jobb från jobbswipe.',
}

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbJobs: SwipeJob[] = []
  if (user) {
    const { data } = await supabase
      .from('saved_jobs')
      .select('job:jobs(id, title, description, salary, location, work_type, employer_name, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    dbJobs = (data ?? [])
      .map((row: any) => row.job)
      .filter((j: SwipeJob | null): j is SwipeJob => !!j)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {user && <SyncSavedOnLoad />}

      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Sparade jobb</h1>
          <p className="mt-1 text-sm font-medium text-neutral-500">Jobb du gillat genom att swipa.</p>
        </div>
        <Link
          href="/swipe"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Swipa mer
        </Link>
      </div>

      {user ? (
        dbJobs.length > 0 ? (
          <div className="space-y-3">
            {dbJobs.map((job) => (
              <SavedJobRow key={job.id} job={job} isAuthed />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white py-16 text-center">
            <span className="text-4xl">🔖</span>
            <h2 className="mt-4 text-lg font-bold text-neutral-900">Inga sparade jobb än</h2>
            <p className="mt-1 text-sm text-neutral-500">Swipa höger på jobb du gillar så hamnar de här.</p>
            <Link href="/swipe" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              Börja swipa →
            </Link>
          </div>
        )
      ) : (
        <SavedJobsLocal />
      )}
    </div>
  )
}
