'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Skickas när något markerats som läst, så att räknaren inte väntar på nästa sidbyte.
export const UNREAD_CHANGED = 'prolink:unread-changed'

export function notifyUnreadChanged() {
  window.dispatchEvent(new Event(UNREAD_CHANGED))
}

/**
 * Antal konversationer med en ny offert eller olästa meddelanden. Hämtas vid
 * sidbyte, när fönstret får fokus och när något markerats som läst.
 */
export function useUnreadCount(userId: string | null | undefined) {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  const [supabase] = useState(createClient)

  useEffect(() => {
    if (!userId) return
    let active = true
    async function load() {
      const { data, error } = await supabase.rpc('unread_count')
      if (active && !error) setCount(Number(data) || 0)
    }
    void load()
    window.addEventListener('focus', load)
    window.addEventListener(UNREAD_CHANGED, load)
    return () => {
      active = false
      window.removeEventListener('focus', load)
      window.removeEventListener(UNREAD_CHANGED, load)
    }
  }, [supabase, userId, pathname])

  return userId ? count : 0
}
