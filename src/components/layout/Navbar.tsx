import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let chatCount = 0
  let notifCount = 0

  if (user) {
    const { data } = await supabase.from('users').select('name, role').eq('id', user.id).single()
    profile = data

    // Active conversations (accepted/delivered offers where user is participant)
    const { data: providerOffers } = await supabase
      .from('offers')
      .select('id')
      .eq('provider_id', user.id)
      .in('status', ['accepted', 'delivered'])

    const { data: myJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', user.id)

    const jobIds = myJobs?.map((j: any) => j.id) ?? []
    const { data: customerOffers } = jobIds.length > 0
      ? await supabase.from('offers').select('id').in('job_id', jobIds).in('status', ['accepted', 'delivered'])
      : { data: [] }

    chatCount = (providerOffers?.length ?? 0) + (customerOffers?.length ?? 0)

    // Notifications: pending offers for customers / accepted offers to act on for providers
    if (profile?.role === 'customer' && jobIds.length > 0) {
      const { count } = await supabase
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'pending')
      notifCount = count ?? 0
    } else if (profile?.role === 'provider') {
      const { count } = await supabase
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id)
        .eq('status', 'accepted')
      notifCount = count ?? 0
    }
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
              {[
                { href: '/services', label: 'Tjänster' },
                { href: '/jobs', label: 'Uppdrag' },
              ].map(({ href, label }) => (
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
            {user && profile ? (
              <>
                {/* Quick action */}
                {profile.role === 'customer' && (
                  <Link
                    href="/jobs/create"
                    className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
                  >
                    + Nytt uppdrag
                  </Link>
                )}
                {profile.role === 'provider' && (
                  <Link
                    href="/services/create"
                    className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
                  >
                    + Ny tjänst
                  </Link>
                )}

                {/* Notification bell */}
                <Link href={profile.role === 'customer' ? '/jobs' : '/offers'} className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </Link>

                {/* Chat icon */}
                <Link href="/messages" className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {chatCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {chatCount > 9 ? '9+' : chatCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {profile.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{profile.name?.split(' ')[0] || 'Profil'}</span>
                </Link>

                <form action={logout}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors px-2 py-1.5"
                  >
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
        </div>
      </div>
    </header>
  )
}
