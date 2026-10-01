import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { getCategoryLabel } from '@/lib/categories'
import type { AdminAlert, AdminJob } from '@/lib/admin-insights.mjs'

// Servern kör i UTC på Vercel. Adminsidan visar alltid svensk tid.
const dateTime = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Stockholm' })
const shortDate = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', timeZone: 'Europe/Stockholm' })

export function when(date: string | null) {
  if (!date) return '–'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? '–' : dateTime.format(parsed)
}

export function day(date: string) {
  return shortDate.format(new Date(date))
}

export function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-rubrik`} className="scroll-mt-24">
      <h2 id={`${id}-rubrik`} className="page-heading text-xl">{title}</h2>
      {description && <p className="mt-1 max-w-prose text-sm text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function StatTile({ label, value, detail, emphasis }: { label: string; value: number; detail?: string; emphasis?: 'warning' }) {
  return (
    <div className={cn('surface p-5', emphasis === 'warning' && 'border-amber-300 bg-amber-50/40')}>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  )
}

const ALERT_STYLE: Record<AdminAlert['level'], { label: string; className: string; icon: string }> = {
  critical: { label: 'Åtgärda', className: 'border-red-200 bg-red-50 text-red-900', icon: '!' },
  warning: { label: 'Bevaka', className: 'border-amber-200 bg-amber-50 text-amber-900', icon: '▲' },
  info: { label: 'Bra att veta', className: 'border-slate-200 bg-white text-slate-700', icon: 'i' },
}

export function Alerts({ alerts }: { alerts: AdminAlert[] }) {
  if (!alerts.length) return <p className="surface p-5 text-sm text-slate-600">Inget som kräver åtgärd just nu.</p>
  return (
    <ul className="space-y-2">
      {alerts.map(alert => {
        const style = ALERT_STYLE[alert.level]
        return (
          <li key={alert.text} className={cn('flex gap-3 rounded-xl border p-4 text-sm', style.className)}>
            <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">{style.icon}</span>
            <span><span className="font-bold">{style.label}: </span>{alert.text}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function Table({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

export const th = 'whitespace-nowrap border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500'
export const td = 'border-b border-slate-100 px-4 py-3 align-top text-slate-700'
export const num = 'text-right tabular-nums'

// En stapel per steg, en enda färg: längden bär värdet och siffran står
// alltid som text bredvid, så tratten går att läsa utan att tolka färg.
export function Funnel({ title, steps }: { title: string; steps: { label: string; count: number }[] }) {
  const max = Math.max(1, ...steps.map(step => step.count))
  return (
    <div className="surface p-5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const previous = index > 0 ? steps[index - 1].count : null
          const share = previous ? Math.round((step.count / previous) * 100) : null
          return (
            <li key={step.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-slate-700">{step.label}</span>
                <span className="tabular-nums text-slate-900">
                  <span className="font-bold">{step.count}</span>
                  {share !== null && <span className="ml-2 text-xs text-slate-500">{share} %</span>}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${(step.count / max) * 100}%` }} />
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const JOB_STATUS: Record<AdminJob['status'], string> = { open: 'open', closed: 'closed', archived: 'closed' }

export function JobActivity({ jobs, empty }: { jobs: AdminJob[]; empty: string }) {
  if (!jobs.length) return <p className="surface p-5 text-sm text-slate-600">{empty}</p>
  return (
    <div className="space-y-3">
      {jobs.map(job => (
        <article key={job.id} className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/jobs/${job.id}`} className="font-bold text-slate-900 hover:text-accent-strong">{job.title}</Link>
                {job.direct && <Badge variant="info">Förfrågan till {job.requestedProviderName}</Badge>}
                {job.status === 'archived' ? <Badge>Arkiverat</Badge> : <StatusBadge status={JOB_STATUS[job.status]} />}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {getCategoryLabel(job.category)} · {job.customerName}{job.customerEmail ? ` (${job.customerEmail})` : ''} · {when(job.createdAt)}
                {job.budget ? ` · budget ${formatCurrency(job.budget)}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="font-heading text-2xl font-extrabold tabular-nums text-slate-900">{job.offers.length}</p>
              <p className="text-xs text-slate-500">{job.offers.length === 1 ? 'offert' : 'offerter'}</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            {job.direct
              ? `Mottagaren ${job.notifiedDelivered > 0 ? 'har fått mejl om förfrågan' : 'har inte fått något mejl ännu'}.`
              : `${job.notifiedDelivered} frilansare fick mejl när uppdraget publicerades${job.notifiedQueued > job.notifiedDelivered ? ` (${job.notifiedQueued - job.notifiedDelivered} väntar eller misslyckades)` : ''}.`}
            {job.providersJoinedAfter > 0 && (
              <span className="text-amber-800"> {job.providersJoinedAfter} frilansare har registrerat sig efteråt och har inte fått något mejl om det.</span>
            )}
          </p>

          {job.offers.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {job.offers.map(offer => (
                <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <Link href={`/profile/${offer.providerId}`} className="font-semibold text-slate-900 hover:text-accent-strong">{offer.providerName}</Link>
                    {offer.providerInternal && <Badge className="ml-2">Intern</Badge>}
                    <span className="ml-2 text-slate-500">{formatCurrency(offer.price)}{offer.priceType === 'hourly' ? '/tim' : ''} · {when(offer.createdAt)}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {offer.messages > 0 && <span>{offer.messages} meddelanden</span>}
                    {offer.status === 'pending' && <span>{offer.customerRead ? 'Läst av kunden' : 'Oläst av kunden'}</span>}
                    <StatusBadge status={offer.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  )
}
