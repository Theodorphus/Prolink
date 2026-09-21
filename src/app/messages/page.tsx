import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import Pagination from '@/components/ui/Pagination'
import { pageNumber, PAGE_SIZE } from '@/lib/pagination'
import { formatDateTime } from '@/lib/utils'
export const metadata = { title: 'Konversationer', robots: { index: false, follow: false } }
type Conversation = { id: string; title: string; other_name: string; last_content: string | null; last_sender: string | null; last_at: string; unread: boolean; total: number }
export default async function MessagesOverviewPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = pageNumber(params.page)
  const { data: { user } } = await getUser()
  if (!user) redirect('/login?redirect=/messages')
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('conversation_list', { p_page: page })
  if (error) throw new Error('Konversationerna kunde inte hämtas.')
  const conversations = (data ?? []) as Conversation[]
  return <div className="mx-auto max-w-3xl px-4 py-12"><h1 className="page-heading mb-6 text-3xl">Konversationer</h1>
    {conversations.length === 0 && <p>Inga konversationer på den här sidan.</p>}
    <div className="space-y-3">{conversations.map(c => <Link key={c.id} href={`/messages/${c.id}`} className={`surface block p-5 ${c.unread ? 'border-blue-400' : ''}`}>
      <div className="flex justify-between gap-3"><h2 className="font-semibold">{c.other_name}{c.unread && <span className="ml-2 text-xs text-blue-700">Oläst</span>}</h2><time className="text-xs text-slate-500">{formatDateTime(c.last_at)}</time></div>
      <p className="text-sm text-slate-500">{c.title}</p><p className="mt-2 truncate text-sm">{c.last_sender === user.id ? 'Du: ' : ''}{c.last_content ?? 'Öppna konversationen'}</p>
    </Link>)}</div>
    <Pagination page={page} total={conversations[0]?.total ?? 0} pageSize={PAGE_SIZE} pathname="/messages" params={params} />
  </div>
}
