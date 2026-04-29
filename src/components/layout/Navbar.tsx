import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/Button'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('users').select('name, role').eq('id', user.id).single()
    profile = data
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">
              Prolink
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/services" className="hover:text-gray-900 transition-colors">Tjänster</Link>
              <Link href="/jobs" className="hover:text-gray-900 transition-colors">Uppdrag</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user && profile ? (
              <>
                {profile.role === 'customer' && (
                  <Link href="/jobs/create">
                    <Button size="sm">+ Nytt uppdrag</Button>
                  </Link>
                )}
                {profile.role === 'provider' && (
                  <Link href="/services/create">
                    <Button size="sm">+ Ny tjänst</Button>
                  </Link>
                )}
                <Link href={`/profile/${user.id}`} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  {profile.name || 'Profil'}
                </Link>
                <form action={logout}>
                  <Button type="submit" variant="ghost" size="sm">Logga ut</Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Logga in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Kom igång</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
