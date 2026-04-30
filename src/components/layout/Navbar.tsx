import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let unreadCount = 0

  if (user) {
    const { data } = await supabase.from('users').select('name, role').eq('id', user.id).single()
    profile = data

    const countUnread = (convs: any[], readField: string, userId: string) =>
      (convs ?? []).filter((o: any) => {
        const msgs = (Array.isArray(o.messages) ? o.messages : [])
          .filter((m: any) => m.sender_id !== userId)
        if (msgs.length === 0) return false
        const lastMsg = msgs.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        if (!o[readField]) return true
        return new Date(lastMsg.created_at) > new Date(o[readField])
      }).length

    if (profile?.role === 'customer') {
      const { data: myJobs } = await supabase.from('jobs').select('id').eq('customer_id', user.id)
      const jobIds = myJobs?.map((j: any) => j.id) ?? []
      if (jobIds.length > 0) {
        const { data: convs } = await supabase
          .from('offers')
          .select('id, customer_read_at, messages(sender_id, created_at)')
          .in('job_id', jobIds)
          .in('status', ['accepted', 'delivered', 'completed'])
        unreadCount = countUnread(convs ?? [], 'customer_read_at', user.id)
      }
    } else if (profile?.role === 'provider') {
      const { data: convs } = await supabase
        .from('offers')
        .select('id, provider_read_at, messages(sender_id, created_at)')
        .eq('provider_id', user.id)
        .in('status', ['accepted', 'delivered', 'completed'])
      unreadCount = countUnread(convs ?? [], 'provider_read_at', user.id)
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

                {/* Chat icon — badge visar olästa meddelanden */}
                <Link href="/messages" className="relative p-2.5 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100" aria-label="Meddelanden">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
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
