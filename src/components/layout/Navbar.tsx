import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import MobileMenu from './MobileMenu'

const NAV_LINKS = [
  { href: '/jobs', label: 'Hitta jobb' },
  { href: '/swipe', label: 'Swipa' },
  { href: '/saved', label: 'Sparade' },
  { href: '/jobs/create', label: 'Lägg upp jobb' },
]

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null

  if (user) {
    const { data } = await supabase.from('users').select('name').eq('id', user.id).single()
    profile = data
  }

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 nav-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-10">
            <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
              Prolink
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-150 relative group"
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-200" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop auth controls */}
            <div className="hidden md:flex items-center gap-1">
              {user && profile ? (
                <>
                  <Link
                    href="/jobs/create"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
                  >
                    + Lägg upp jobb
                  </Link>

                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {profile.name?.[0]?.toUpperCase()}
                    </div>
                    <span>{profile.name?.split(' ')[0] || 'Profil'}</span>
                  </Link>

                  <form action={logout}>
                    <button type="submit" className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors px-2 py-1.5">
                      Logga ut
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
                    Logga in
                  </Link>
                  <Link href="/register" className="nav-cta inline-flex items-center text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors px-4 py-2 rounded-lg">
                    Kom igång
                  </Link>
                </>
              )}
            </div>

            <MobileMenu
              links={NAV_LINKS}
              user={user && profile ? { id: user.id, name: profile.name ?? '' } : null}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
