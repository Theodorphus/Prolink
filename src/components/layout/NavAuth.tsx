'use client'

import Image from 'next/image'
import Link from '@/components/i18n/Link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocalePath, useT } from '@/i18n/client'
import MobileMenu from './MobileMenu'
import { useNavUser, type NavUser } from './useNavUser'
import { useUnreadCount } from './useUnreadCount'

interface NavLink {
  href: string
  label: string
}

export function UnreadBadge({ count }: { count: number }) {
  const t = useT()
  if (!count) return null
  return (
    <span className="min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-xs font-bold leading-none text-white">
      {count > 9 ? '9+' : count}
      <span className="sr-only"> {t('olästa')}</span>
    </span>
  )
}

export function NavAvatar({ user, size }: { user: NavUser; size: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-xs font-bold text-gray-600"
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        user.name?.[0]?.toUpperCase() || 'P'
      )}
    </span>
  )
}

export default function NavAuth({ links }: { links: NavLink[] }) {
  const user = useNavUser()
  const unread = useUnreadCount(user?.id)
  const router = useRouter()
  const t = useT()
  const localePath = useLocalePath()

  // Utloggningen sker i webbläsaren så att useNavUser får SIGNED_OUT direkt.
  // En serveraction rensade cookies utan att den här komponenten märkte det,
  // och navigeringen ligger kvar monterad mellan sidbyten.
  async function signOut() {
    try { await createClient().auth.signOut() } finally {
      router.push(localePath('/login'))
      router.refresh()
    }
  }

  const mobileLinks = user ? [...links, { href: '/messages', label: t('Meddelanden'), badge: unread }] : links

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
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              {t('Meddelanden')}
              <UnreadBadge count={unread} />
            </Link>
            <Link
              href="/jobs/create"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              {t('+ Publicera uppdrag')}
            </Link>
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              <NavAvatar user={user} size={28} />
              <span>{user.name?.split(' ')[0] || t('Profil')}</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors px-2 py-1.5"
            >
              {t('Logga ut')}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" prefetch={false} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
              {t('Logga in')}
            </Link>
            <Link href="/register" prefetch={false} className="nav-cta inline-flex items-center text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors px-4 py-2 rounded-lg">
              {t('Kom igång')}
            </Link>
          </>
        )}
      </div>

      <MobileMenu links={mobileLinks} user={user} onSignOut={signOut} />
    </>
  )
}
