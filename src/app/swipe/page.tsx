import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import JobSwipe from '@/components/swipe/JobSwipe'
import type { SwipeJob } from '@/components/swipe/JobSwipeCard'

export const metadata = {
  title: 'Swipa jobb i Göteborg – Hitta ditt nästa jobb',
  description: 'Swipa dig igenom lediga jobb i Göteborg. Höger för intresserad, vänster för att hoppa över.',
}

export default async function SwipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('jobs')
    .select('id, title, description, salary, location, work_type, employer_name, category')
    .eq('status', 'open')
    .order('is_demo', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(50)

  const jobs = (data ?? []) as SwipeJob[]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-neutral-50 px-4 py-6 sm:py-10">
      <div className="mb-5 text-center sm:mb-8">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500">Swipa</p>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Hitta jobb genom att swipa</h1>
        <p className="mt-2 text-sm font-medium text-neutral-500">
          Höger för intresserad, vänster för att hoppa över.
        </p>
      </div>

      {jobs.length > 0 ? (
        <JobSwipe jobs={jobs} isAuthed={!!user} />
      ) : (
        <div className="flex h-[500px] w-full max-w-sm flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <span className="text-5xl">📭</span>
          <h2 className="text-xl font-bold text-neutral-900">Inga öppna jobb just nu</h2>
          <Link href="/jobs" className="mt-2 text-sm font-medium text-blue-600 hover:underline">
            Gå till jobblistan →
          </Link>
        </div>
      )}
    </div>
  )
}
