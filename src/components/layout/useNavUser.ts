'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { hasSessionCookie, lazyClient } from '@/lib/supabase/lazy-client'

export interface NavUser {
  id: string
  name: string
  avatarUrl: string | null
}

// Skickas när namn eller profilbild sparats, så att navigeringen inte visar
// det gamla förrän sidan laddas om.
const PROFILE_CHANGED = 'prolink:profile-changed'

export function notifyProfileChanged() {
  window.dispatchEvent(new Event(PROFILE_CHANGED))
}

/**
 * Inloggningsläget för navigeringen, läst i webbläsaren.
 *
 * Navigeringen ligger i rotlayouten. När den läste cookies på servern blev
 * varje sida dynamisk och kunde aldrig cachas, inte ens FAQ och villkoren.
 * Läget hämtas därför här i stället, så att publika sidor kan förrenderas.
 *
 * undefined betyder att läget ännu inte är känt (före hydrering), null att
 * besökaren är utloggad.
 *
 * Inloggning och registrering sker i serveractioner som sätter cookies utan
 * att webbläsarklienten märker det, så sessionen läses om vid varje
 * sidbyte. getSession läser bara cookien lokalt; namn och profilbild hämtas
 * bara när användaren byts eller profilen har sparats. Utan sessionscookie
 * är besökaren utloggad, och Supabase-klienten laddas då inte alls.
 */
export function useNavUser(): NavUser | null | undefined {
  const pathname = usePathname()
  const [user, setUser] = useState<NavUser | null | undefined>(undefined)
  const cached = useRef<NavUser | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    async function sync(userId: string | undefined) {
      if (!userId) {
        cached.current = null
        if (active) setUser(null)
        return
      }
      if (cached.current?.id === userId) {
        if (active) setUser(cached.current)
        return
      }
      const supabase = await lazyClient()
      const { data } = await supabase.from('users').select('name, avatar_url').eq('id', userId).maybeSingle()
      cached.current = { id: userId, name: data?.name ?? '', avatarUrl: data?.avatar_url ?? null }
      if (active) setUser(cached.current)
    }

    async function read() {
      if (!hasSessionCookie()) return sync(undefined)
      const supabase = await lazyClient()
      if (!active) return
      if (!unsubscribe) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          void sync(session?.user.id)
        })
        unsubscribe = () => subscription.unsubscribe()
      }
      const { data } = await supabase.auth.getSession()
      await sync(data.session?.user.id)
    }
    function load() {
      read().catch(() => { if (active) setUser(null) })
    }
    function reload() {
      cached.current = null
      load()
    }

    load()
    window.addEventListener(PROFILE_CHANGED, reload)

    return () => {
      active = false
      window.removeEventListener(PROFILE_CHANGED, reload)
      unsubscribe?.()
    }
  }, [pathname])

  return user
}
