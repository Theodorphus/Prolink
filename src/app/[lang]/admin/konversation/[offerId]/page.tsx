import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from '@/components/i18n/Link'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'

export const metadata: Metadata = { title: 'Konversation – Admin', robots: { index: false, follow: false } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Läsvy för operatören, för att kunna granska misstänkta bedrägerier. Bara
// läsning: inget markeras som läst, så parternas olästmarkeringar och
// "Läst"-status påverkas inte av att admin tittar.
export default async function AdminConversationPage(props: { params: Promise<{ offerId: string }> }) {
  const admin = await requireAdmin()
  const { offerId } = await props.params
  if (!UUID.test(offerId)) notFound()

  const db = createAdminClient()
  const { data: offer } = await db
    .from('offers')
    .select('id, status, price, price_type, timeline, description, created_at, provider_id, job:jobs(id, title, customer_id)')
    .eq('id', offerId)
    .maybeSingle()
  if (!offer) notFound()
  const job = Array.isArray(offer.job) ? offer.job[0] : offer.job

  const participantIds = [offer.provider_id, job?.customer_id].filter((id): id is string => Boolean(id))
  const [{ data: people }, { data: messages }] = await Promise.all([
    db.from('users').select('id, name, created_at').in('id', participantIds),
    db.from('messages').select('id, sender_id, content, attachment_path, created_at').eq('offer_id', offerId).order('created_at').order('id'),
  ])
  const nameOf = (id: string) => people?.find(person => person.id === id)?.name ?? 'Okänd'

  // Bilagor ligger i en privat bucket; länkarna gäller i fem minuter.
  const attachmentUrls = new Map<string, string>()
  await Promise.all((messages ?? []).filter(message => message.attachment_path).map(async message => {
    const { data } = await db.storage.from('attachments').createSignedUrl(message.attachment_path!, 5 * 60)
    if (data) attachmentUrls.set(message.id, data.signedUrl)
  }))

  // Spår i serverloggen av vem som läst vilken konversation.
  console.info(`[admin] ${admin.email} läste konversation ${offerId}`)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <Link href="/admin#senaste" className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Tillbaka till admin</Link>
      <p className="page-eyebrow mt-6">Admin · Konversation</p>
      <h1 className="page-heading mt-2 text-2xl">{job ? <Link href={`/jobs/${job.id}`} className="hover:text-accent-strong">{job.title}</Link> : 'Okänt uppdrag'}</h1>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {job && <div><dt className="text-slate-500">Uppdragsgivare</dt><dd><Link href={`/profile/${job.customer_id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{nameOf(job.customer_id)}</Link></dd></div>}
        <div><dt className="text-slate-500">Frilansare</dt><dd><Link href={`/profile/${offer.provider_id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{nameOf(offer.provider_id)}</Link></dd></div>
      </dl>

      <section className="surface mt-6 p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900">Offert: {formatCurrency(offer.price)}{offer.price_type === 'hourly' ? '/tim' : ''}</span>
          {offer.timeline && <span className="text-slate-500">· {offer.timeline}</span>}
          <StatusBadge status={offer.status} />
          <time className="ml-auto text-xs tabular-nums text-slate-500">{formatDateTime(offer.created_at, 'sv')}</time>
        </div>
        {offer.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">{offer.description}</p>}
      </section>

      <h2 className="mt-8 text-lg font-bold text-slate-900">Meddelanden ({messages?.length ?? 0})</h2>
      {!messages?.length ? (
        <p className="mt-3 text-sm text-slate-500">Inga meddelanden i den här konversationen.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {messages.map(message => {
            const fromProvider = message.sender_id === offer.provider_id
            return (
              <li key={message.id} className={`rounded-xl border px-4 py-3 text-sm ${fromProvider ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    {nameOf(message.sender_id)} <span className="font-normal text-slate-500">({fromProvider ? 'frilansare' : 'uppdragsgivare'})</span>
                  </span>
                  <time className="text-xs tabular-nums text-slate-500">{formatDateTime(message.created_at, 'sv')}</time>
                </div>
                {message.content && <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">{message.content}</p>}
                {message.attachment_path && (
                  attachmentUrls.has(message.id)
                    ? <a href={attachmentUrls.get(message.id)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700 underline">Öppna bilaga</a>
                    : <p className="mt-2 text-xs text-red-700">Bilagan kunde inte hämtas.</p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
