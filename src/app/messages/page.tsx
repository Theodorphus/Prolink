import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Konversationer' }

export default async function MessagesOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Offers where user is provider
  const { data: asProvider } = await supabase
    .from('offers')
    .select('id, status, job:jobs(id, title, customer:users(id, name, avatar_url)), messages(id, content, created_at, sender_id)')
    .eq('provider_id', user.id)
    .in('status', ['accepted', 'delivered', 'completed'])
    .order('created_at', { ascending: false })

  // Jobs owned by user → offers on those jobs
  const { data: myJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('customer_id', user.id)

  const jobIds = myJobs?.map((j: any) => j.id) ?? []

  const { data: asCustomer } = jobIds.length > 0
    ? await supabase
        .from('offers')
        .select('id, status, job:jobs(id, title), provider:users(id, name, avatar_url), messages(id, content, created_at, sender_id)')
        .in('job_id', jobIds)
        .in('status', ['accepted', 'delivered', 'completed'])
        .order('created_at', { ascending: false })
    : { data: [] }

  // Merge and sort by last message
  const all = [
    ...(asProvider ?? []).map((o: any) => ({
      ...o,
      otherParty: Array.isArray(o.job?.customer) ? o.job.customer[0] : o.job?.customer,
      jobTitle: Array.isArray(o.job) ? o.job[0]?.title : o.job?.title,
    })),
    ...(asCustomer ?? []).map((o: any) => ({
      ...o,
      otherParty: Array.isArray(o.provider) ? o.provider[0] : o.provider,
      jobTitle: Array.isArray(o.job) ? o.job[0]?.title : o.job?.title,
    })),
  ].sort((a, b) => {
    const aLast = a.messages?.at(-1)?.created_at ?? a.created_at
    const bLast = b.messages?.at(-1)?.created_at ?? b.created_at
    return new Date(bLast).getTime() - new Date(aLast).getTime()
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Konversationer</h1>

      {all.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">Inga aktiva konversationer ännu.</p>
          <Link href="/jobs" className="mt-4 inline-flex text-sm text-blue-600 hover:underline">Hitta uppdrag →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((conv: any) => {
            const lastMsg = conv.messages?.at(-1)
            const isUnread = lastMsg && lastMsg.sender_id !== user.id
            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="group block">
                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-150 ${
                  isUnread
                    ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                }`}>
                  {/* Avatar */}
                  <div className="relative w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 shrink-0 overflow-hidden">
                    {conv.otherParty?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={conv.otherParty.avatar_url} alt={conv.otherParty.name} className="w-full h-full object-cover" />
                    ) : (
                      conv.otherParty?.name?.[0]?.toUpperCase()
                    )}
                    {isUnread && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conv.otherParty?.name ?? 'Okänd'}
                      </p>
                      {lastMsg && (
                        <span className="text-xs text-gray-400 shrink-0">{formatDateTime(lastMsg.created_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{conv.jobTitle}</p>
                    {lastMsg && (
                      <p className={`text-sm truncate mt-0.5 ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                        {lastMsg.sender_id === user.id ? 'Du: ' : ''}{lastMsg.content}
                      </p>
                    )}
                  </div>

                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
