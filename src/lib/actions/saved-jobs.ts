'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' as const }

  const { error } = await supabase
    .from('saved_jobs')
    .insert({ user_id: user.id, job_id: jobId })

  // ignore duplicate (unique violation) — already saved
  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath('/saved')
  return { success: true as const }
}

export async function unsaveJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' as const }

  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', user.id)
    .eq('job_id', jobId)

  if (error) return { error: error.message }

  revalidatePath('/saved')
  return { success: true as const }
}

/** Persist a list of job ids saved while logged out (from localStorage). */
export async function syncSavedJobs(jobIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || jobIds.length === 0) return { synced: 0 }

  const rows = jobIds.map((job_id) => ({ user_id: user.id, job_id }))
  const { error } = await supabase
    .from('saved_jobs')
    .upsert(rows, { onConflict: 'user_id,job_id', ignoreDuplicates: true })

  if (error) return { error: error.message }

  revalidatePath('/saved')
  return { synced: jobIds.length }
}
