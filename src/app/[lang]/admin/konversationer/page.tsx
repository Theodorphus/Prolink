import type { Metadata } from 'next'
import Link from '@/components/i18n/Link'
import { requireAdmin, selectAll } from '@/lib/admin'
import { buildConversationRows, filterConversationRows } from '@/lib/admin-conversations.mjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { when } from '@/components/admin/AdminUi'
import { cn, formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Konversationer – Admin', robots: { index: false, follow: false } }

const PER_PAGE = 50

type Search = { q?: string; sida?: string; typ?: string; tjanst?: string }

// Alla offerter med sin chatt och alla förfrågningar till en viss frilansare,
// senaste aktivitet först. Varje rad leder till en läsvy. ?typ=forfragningar
// visar bara förfrågningar och ?tjanst=<id> bara förfrågningar på en tjänst.
export default async function AdminConversationsPage(props: { searchParams: Promise<Search> }) {
  await requireAdmin()
  const { q = '', sida = '1', typ = '', tjanst = '' } = await props.searchParams
  const inquiriesOnly = typ === 'forfragningar'
  const page = Math.max(1, Number.parseInt(sida, 10) || 1)

  const db = createAdminClient()
  const [offers, jobs, users, messages, services] = await Promise.all([
    selectAll((from, to) => db.from('offers').select('id, job_id, provider_id, price, price_type, status, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => db.from('jobs').select('id, title, customer_id, requested_provider_id, service_id, status, archived_at, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => db.from('users').select('id, name').order('created_at').range(from, to)),
    selectAll((from, to) => db.from('messages').select('offer_id, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => db.from('services').select('id, title').order('created_at').range(from, to)),
  ])

  const all = buildConversationRows({ offers, jobs, users, messages, services })
  const rows = filterConversationRows(all, { query: q, inquiriesOnly, serviceId: tjanst })
  const inquiryCount = all.filter(row => row.inquiry).length
  const service = tjanst ? services.find(row => row.id === tjanst) : undefined

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const visible = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const href = (params: Search) => {
    const search = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString()
    return `/admin/konversationer${search ? `?${search}` : ''}`
  }
  const pageHref = (n: number) => href({ q, typ, tjanst, sida: String(n) })
  const tab = (active: boolean) => cn('rounded-full border px-3 py-1.5 text-xs font-semibold', active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900')

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <Link href="/admin" className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Tillbaka till admin</Link>
      <p className="page-eyebrow mt-6">Admin</p>
      <h1 className="page-heading mt-2 text-2xl">Konversationer</h1>
      <p className="mt-2 text-sm text-slate-500">
        Alla offerter med chatt och alla förfrågningar till en viss frilansare, senaste aktivitet först.
        Att du läser markerar inget som läst, så parterna kan inte se att du tittat.
      </p>

      <nav aria-label="Filter" className="mt-6 flex flex-wrap gap-2">
        <Link href={href({ q })} className={tab(!inquiriesOnly && !tjanst)} aria-current={!inquiriesOnly && !tjanst ? 'page' : undefined}>Alla ({all.length})</Link>
        <Link href={href({ q, typ: 'forfragningar' })} className={tab(inquiriesOnly && !tjanst)} aria-current={inquiriesOnly && !tjanst ? 'page' : undefined}>Förfrågningar ({inquiryCount})</Link>
      </nav>
      {tjanst && (
        <p className="mt-3 text-sm text-slate-700">
          Förfrågningar på tjänsten <span className="font-semibold">{service ? <Link href={`/services/${tjanst}`} className="hover:text-accent-strong">{service.title}</Link> : 'som inte längre finns'}</span>
          {' · '}<Link href={href({ q, typ: 'forfragningar' })} className="text-blue-700 underline">Visa alla förfrågningar</Link>
        </p>
      )}

      <form className="mt-4 flex gap-2" action="">
        {typ && <input type="hidden" name="typ" value={typ} />}
        {tjanst && <input type="hidden" name="tjanst" value={tjanst} />}
        <input name="q" defaultValue={q} placeholder="Sök på namn, uppdrag eller tjänst" aria-label="Sök på namn, uppdrag eller tjänst" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Sök</button>
      </form>
      <p className="mt-3 text-xs text-slate-500">
        {rows.length} {rows.length === 1 ? 'träff' : 'träffar'}
        {q.trim() && <> för ”{q}” · <Link href={href({ typ, tjanst })} className="underline">Rensa sökningen</Link></>}
      </p>

      <ul className="surface mt-3 divide-y divide-slate-100">
        {visible.map(row => (
          <li key={row.id}>
            <Link href={row.href} className="block px-4 py-3 text-sm hover:bg-slate-50">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-slate-900">{row.from} → {row.to}</span>
                <time className="text-xs tabular-nums text-slate-500">{when(row.lastAt)}</time>
              </div>
              <div className="mt-0.5 truncate text-slate-600">{row.title}</div>
              {row.inquiry && (
                <div className="mt-0.5 truncate text-xs text-slate-500">{row.serviceTitle ? `Om tjänsten ${row.serviceTitle}` : 'Ingen kopplad tjänst (skickad från profilen, eller tjänsten är borttagen)'}</div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {row.inquiry && <Badge variant="info">Förfrågan</Badge>}
                {row.offer ? (
                  <>
                    <span>{formatCurrency(Number(row.offer.price))}{row.offer.priceType === 'hourly' ? '/tim' : ''}</span>
                    <span>· {row.offer.messages} {row.offer.messages === 1 ? 'meddelande' : 'meddelanden'}</span>
                    <StatusBadge status={row.offer.status} />
                  </>
                ) : (
                  <span className={row.closed ? undefined : 'font-semibold text-amber-800'}>{row.closed ? 'Stängd utan offert' : 'Ingen offert ännu'}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
        {visible.length === 0 && <li className="px-4 py-6 text-sm text-slate-600">{inquiriesOnly || tjanst ? 'Inga förfrågningar hittades.' : 'Inga konversationer hittades.'}</li>}
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
