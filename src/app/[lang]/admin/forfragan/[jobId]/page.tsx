import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from '@/components/i18n/Link'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { InquiryRequest, when } from '@/components/admin/AdminUi'

export const metadata: Metadata = { title: 'Förfrågan – Admin', robots: { index: false, follow: false } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Läsvy för en förfrågan till en viss frilansare, också innan frilansaren
// svarat. Förfrågan syns annars bara för parterna. Bara läsning med serverns
// nyckel: förfrågningar har ingen läsmarkering och offerternas markeringar
// rörs inte, så parterna kan inte se att admin tittat.
export default async function AdminInquiryPage(props: { params: Promise<{ jobId: string }> }) {
  const admin = await requireAdmin()
  const { jobId } = await props.params
  if (!UUID.test(jobId)) notFound()

  const db = createAdminClient()
  const { data: job, error } = await db
    .from('jobs')
    .select('id, customer_id, requested_provider_id, service_id, title, description, budget, category, location, work_type, status, archived_at, created_at, edited_at, service:services(title)')
    .eq('id', jobId)
    .not('requested_provider_id', 'is', null)
    .maybeSingle()
  if (error) throw new Error('Förfrågan kunde inte hämtas.')
  if (!job) notFound()

  const [{ data: people }, { data: offers }] = await Promise.all([
    db.from('users').select('id, name').in('id', [job.customer_id, job.requested_provider_id]),
    db.from('offers').select('id, price, price_type, status, created_at, messages(count)').eq('job_id', jobId).order('created_at'),
  ])
  const nameOf = (id: string) => people?.find(person => person.id === id)?.name ?? 'Okänd'
  const service = Array.isArray(job.service) ? job.service[0] : job.service
  const closed = job.status === 'closed' || Boolean(job.archived_at)

  // Spår i serverloggen av vem som läst vilken förfrågan.
  console.info(`[admin] ${admin.email} läste förfrågan ${jobId}`)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <Link href="/admin/konversationer?typ=forfragningar" className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Alla förfrågningar</Link>
      <p className="page-eyebrow mt-6">Admin · Förfrågan</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="page-heading text-2xl">{job.title}</h1>
        {job.archived_at ? <Badge>Arkiverad</Badge> : <StatusBadge status={job.status} />}
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Uppdragsgivare</dt><dd><Link href={`/profile/${job.customer_id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{nameOf(job.customer_id)}</Link></dd></div>
        <div><dt className="text-slate-500">Frilansare</dt><dd><Link href={`/profile/${job.requested_provider_id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{nameOf(job.requested_provider_id)}</Link></dd></div>
      </dl>

      <InquiryRequest inquiry={{ ...job, serviceTitle: service?.title ?? null }} customerName={nameOf(job.customer_id)} />

      <h2 className="mt-8 text-lg font-bold text-slate-900">Svar</h2>
      {!offers?.length ? (
        <p className="mt-3 text-sm text-slate-600">
          {closed
            ? `Förfrågan stängdes utan att ${nameOf(job.requested_provider_id)} skickade någon offert.`
            : `${nameOf(job.requested_provider_id)} har inte svarat med en offert ännu. Chatten öppnas först när en offert finns.`}
        </p>
      ) : (
        <ul className="surface mt-3 divide-y divide-slate-100">
          {offers.map(offer => {
            const messages = Array.isArray(offer.messages) ? Number(offer.messages[0]?.count ?? 0) : 0
            return (
              <li key={offer.id}>
                <Link href={`/admin/konversation/${offer.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-slate-50">
                  <span>
                    <span className="font-semibold text-slate-900">Offert: {formatCurrency(Number(offer.price))}{offer.price_type === 'hourly' ? '/tim' : ''}</span>
                    <span className="ml-2 text-xs text-slate-500">{when(offer.created_at)} · {messages} {messages === 1 ? 'meddelande' : 'meddelanden'}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={offer.status} />
                    <span className="text-xs font-semibold text-blue-700">Läs offert och chatt →</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-8 text-xs text-slate-500">Att du läser markerar inget som läst. Parterna kan inte se att du tittat.</p>
    </div>
  )
}
