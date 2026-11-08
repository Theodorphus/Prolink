import type { Metadata } from 'next'
import Link from '@/components/i18n/Link'
import { requireAdmin, selectAll } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusBadge } from '@/components/ui/Badge'
import { when } from '@/components/admin/AdminUi'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Konversationer – Admin', robots: { index: false, follow: false } }

const PER_PAGE = 50

// Alla offerter med sin chatt, senaste aktivitet först. Varje rad leder till
// läsvyn. Sökningen gäller namn på parterna och uppdragets titel.
export default async function AdminConversationsPage(props: { searchParams: Promise<{ q?: string; sida?: string }> }) {
  await requireAdmin()
  const { q = '', sida = '1' } = await props.searchParams
  const query = q.trim().toLowerCase()
  const page = Math.max(1, Number.parseInt(sida, 10) || 1)

  const db = createAdminClient()
  const [offers, jobs, users, messages] = await Promise.all([
    selectAll((from, to) => db.from('offers').select('id, job_id, provider_id, price, price_type, status, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => db.from('jobs').select('id, title, customer_id').order('created_at').range(from, to)),
    selectAll((from, to) => db.from('users').select('id, name').order('created_at').range(from, to)),
    selectAll((from, to) => db.from('messages').select('offer_id, created_at').order('created_at').range(from, to)),
  ])

  const jobsById = new Map(jobs.map(job => [job.id, job]))
  const namesById = new Map(users.map(user => [user.id, user.name]))
  const nameOf = (id: string | undefined) => (id && namesById.get(id)) || 'Namnlös'
  const activity = new Map<string, { count: number; last: string }>()
  for (const message of messages) {
    const entry = activity.get(message.offer_id) ?? { count: 0, last: message.created_at }
    entry.count++
    if (message.created_at > entry.last) entry.last = message.created_at
    activity.set(message.offer_id, entry)
  }

  const rows = offers.map(offer => {
    const job = jobsById.get(offer.job_id)
    const chat = activity.get(offer.id)
    return {
      ...offer,
      title: job?.title ?? 'Okänt uppdrag',
      customer: nameOf(job?.customer_id),
      provider: nameOf(offer.provider_id),
      messages: chat?.count ?? 0,
      lastAt: chat && chat.last > offer.created_at ? chat.last : offer.created_at,
    }
  })
    .filter(row => !query || `${row.customer} ${row.provider} ${row.title}`.toLowerCase().includes(query))
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const visible = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const pageHref = (n: number) => `/admin/konversationer?${new URLSearchParams({ ...(q ? { q } : {}), sida: String(n) })}`

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <Link href="/admin" className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Tillbaka till admin</Link>
      <p className="page-eyebrow mt-6">Admin</p>
      <h1 className="page-heading mt-2 text-2xl">Konversationer</h1>
      <p className="mt-2 text-sm text-slate-500">Alla offerter och deras chattar, senaste aktivitet först. Att du läser markerar inget som läst för parterna.</p>

      <form className="mt-6 flex gap-2" action="">
        <input name="q" defaultValue={q} placeholder="Sök på namn eller uppdrag" aria-label="Sök på namn eller uppdrag" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Sök</button>
      </form>
      <p className="mt-3 text-xs text-slate-500">{rows.length} {rows.length === 1 ? 'konversation' : 'konversationer'}{query && <> för ”{q}” · <Link href="/admin/konversationer" className="underline">Visa alla</Link></>}</p>

      <ul className="surface mt-3 divide-y divide-slate-100">
        {visible.map(row => (
          <li key={row.id}>
            <Link href={`/admin/konversation/${row.id}`} className="block px-4 py-3 text-sm hover:bg-slate-50">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-900">{row.provider} → {row.customer}</span>
                <time className="text-xs tabular-nums text-slate-500">{when(row.lastAt)}</time>
              </div>
              <div className="mt-0.5 truncate text-slate-600">{row.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{formatCurrency(Number(row.price))}{row.price_type === 'hourly' ? '/tim' : ''}</span>
                <span>· {row.messages} {row.messages === 1 ? 'meddelande' : 'meddelanden'}</span>
                <StatusBadge status={row.status} />
              </div>
            </Link>
          </li>
        ))}
        {visible.length === 0 && <li className="px-4 py-6 text-sm text-slate-600">Inga konversationer hittades.</li>}
      </ul>

      {pages > 1 && (
        <nav aria-label="Sidor" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className="font-semibold text-blue-700 hover:underline">← Nyare</Link> : <span />}
          <span className="text-slate-500">Sida {page} av {pages}</span>
          {page < pages ? <Link href={pageHref(page + 1)} className="font-semibold text-blue-700 hover:underline">Äldre →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
