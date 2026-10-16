import { redirect } from 'next/navigation'
import Link from '@/components/i18n/Link'
import { createClient, getUser } from '@/lib/supabase/server'
import Pagination from '@/components/ui/Pagination'
import { pageNumber, PAGE_SIZE } from '@/lib/pagination'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { getLocale, getT } from '@/i18n/server'
import { localePath } from '@/i18n/config'
export async function generateMetadata() {
  return { title: (await getT())('Konversationer'), robots: { index: false, follow: false } }
}
type Conversation = { id: string; title: string; other_name: string; last_content: string | null; last_sender: string | null; last_at: string; unread: boolean; total: number; price: number; price_type: 'fixed' | 'hourly'; status: string; is_customer: boolean }
export default async function MessagesOverviewPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const locale = await getLocale()
  const t = await getT()
  const page = pageNumber(params.page)
  const { data: { user } } = await getUser()
  if (!user) redirect(localePath(locale, '/login?redirect=/messages'))
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('conversation_list', { p_page: page })
  if (error) throw new Error('Konversationerna kunde inte hämtas.')
  const conversations = (data ?? []) as Conversation[]
  return <div className="mx-auto max-w-3xl px-4 py-12"><h1 className="page-heading mb-6 text-3xl">{t('Konversationer')}</h1>
    {conversations.length === 0 && <p>{t('Inga konversationer på den här sidan.')}</p>}
    {/* En konversation är en offert. Utan meddelanden är offerten det enda
        som hänt, så den visas med pris och status i stället för en tom rad. */}
    <div className="space-y-3">{conversations.map(c => {
      const newOffer = c.unread && c.is_customer && !c.last_sender
      return <Link key={c.id} href={`/messages/${c.id}`} className={`surface block p-5 ${c.unread ? 'border-blue-400 bg-blue-50/40' : ''}`}>
        <div className="flex justify-between gap-3"><h2 className="font-semibold">{c.other_name}{c.unread && <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{newOffer ? t('Ny offert') : t('Oläst')}</span>}</h2><time className="text-xs text-slate-500">{formatDateTime(c.last_at, locale)}</time></div>
        <p className="text-sm text-slate-500">{c.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900">{c.is_customer ? t('Offert') : t('Din offert')}: {formatCurrency(c.price, locale)}{c.price_type === 'hourly' ? t('/tim') : ''}</span>
          <StatusBadge status={c.status} />
        </div>
        <p className="mt-2 truncate text-sm">{c.last_sender ? `${c.last_sender === user.id ? t('Du: ') : ''}${c.last_content || t('Bilaga')}` : c.is_customer ? t('Öppna för att läsa offerten och svara') : t('Inga meddelanden ännu')}</p>
      </Link>
    })}</div>
    <Pagination page={page} total={conversations[0]?.total ?? 0} pageSize={PAGE_SIZE} pathname="/messages" params={params} />
  </div>
}
