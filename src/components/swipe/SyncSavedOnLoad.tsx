'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { syncSavedJobs } from '@/lib/actions/saved-jobs'

const SAVED_KEY = 'prolink:saved-jobs'

/** When an authed user lands on /saved, push any locally-saved ids to the DB once. */
export default function SyncSavedOnLoad() {
  const router = useRouter()

  useEffect(() => {
    let ids: string[] = []
    try {
      const raw = window.localStorage.getItem(SAVED_KEY)
      ids = raw ? JSON.parse(raw) : []
    } catch {
      return
    }
    if (ids.length === 0) return

    syncSavedJobs(ids).then((res) => {
      window.localStorage.removeItem(SAVED_KEY)
      if ('synced' in res && (res.synced ?? 0) > 0) router.refresh()
    })
  }, [router])

  return null
}
