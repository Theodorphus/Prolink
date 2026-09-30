'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MobileMenu from './MobileMenu'
import { useNavUser } from './useNavUser'

interface NavLink {
  href: string
  label: string
}

export default function NavAuth({ links }: { links: NavLink[] }) {
  const user = useNavUser()
  const router = useRouter()

  // Utloggningen sker i webbläsaren så att useNavUser får SIGNED_OUT direkt.
  // En serveraction rensade cookies utan att den här komponenten märkte det,
  // och navigeringen ligger kvar monterad mellan sidbyten.
  async function signOut() {
    try { await createClient().auth.signOut() } finally {
      router.push('/login')
      router.refresh()
    }
  }

  const mobileLinks = user ? [...links, { href: '/messages', label: 'Meddelanden' }] : links

  return (
    <>
      <div className="hidden md:flex items-center gap-1">
        {user === undefined ? (
          // Håller platsen tills läget är känt, så att knapparna inte hoppar.
          <span className="block h-9 w-44" aria-hidden />
        ) : user ? (
          <>
            <Link
              href="/messages"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              Meddelanden
            </Link>
            <Link
              href="/jobs/create"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              + Publicera uppdrag
            </Link>
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                {user.name?.[0]?.toUpperCase() || 'P'}
              </span>
              <span>{user.name?.split(' ')[0] || 'Profil'}</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors px-2 py-1.5"
            >
              Logga ut
            </button>
          </>
        ) : (
          <>
            <Link href="/login" prefetch={false} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
              Logga in
            </Link>
            <Link href="/register" prefetch={false} className="nav-cta inline-flex items-center text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors px-4 py-2 rounded-lg">
              Kom igång
            </Link>
          </>
        )}
      </div>

      <MobileMenu links={mobileLinks} user={user} onSignOut={signOut} />
    </>
  )
}
