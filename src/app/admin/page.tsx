import type { Metadata } from 'next'
import Link from 'next/link'
import { loadAdminInsights, requireAdmin } from '@/lib/admin'
import { getCategoryLabel } from '@/lib/categories'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Alerts, Funnel, JobActivity, Section, StatTile, Table, day, num, td, th, when } from '@/components/admin/AdminUi'

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } }

const EVENT_LABEL = {
  user: 'Konto', job: 'Uppdrag', inquiry: 'Förfrågan', offer: 'Offert', service: 'Tjänst', review: 'Recension', message: 'Chatt',
} as const

const NAV = [
  ['att-gora', 'Att uppmärksamma'], ['dina-uppdrag', 'Dina uppdrag'], ['kunders-uppdrag', 'Kunders uppdrag'],
  ['tratt', 'Tratt'], ['anvandare', 'Användare'], ['kategorier', 'Kategorier'], ['veckor', 'Veckor'],
  ['tjanster', 'Tjänster'], ['handelser', 'Händelser'], ['mejl', 'Mejlnotiser'],
] as const

export default async function AdminPage() {
  await requireAdmin()
  const data = await loadAdminInsights()
  const { kpis } = data
  const providers = data.people.filter(person => person.role === 'provider')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <p className="page-eyebrow">Admin</p>
      <h1 className="page-heading mt-2 text-3xl">Aktivitet på Prolink</h1>
      <p className="mt-2 max-w-prose text-sm text-slate-500">
        Hämtad {when(new Date().toISOString())}. Siffrorna räknar bort interna konton (ADMIN_EMAILS och INTERNAL_EMAILS), så du ser vad riktiga användare gör.
        Sidvisningar och besökare finns i Vercel Analytics.
      </p>

      <nav aria-label="Sektioner" className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900">{label}</a>
        ))}
      </nav>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Uppdragsgivare" value={kpis.externalCustomers} detail={`${kpis.externalCustomers30d} nya senaste 30 dagarna`} emphasis={kpis.externalCustomers30d === 0 ? 'warning' : undefined} />
        <StatTile label="Frilansare" value={kpis.externalProviders} detail={`${kpis.externalProviders30d} nya senaste 30 dagarna`} />
        <StatTile label="Uppdrag från kunder" value={kpis.externalPublicJobs + kpis.externalInquiries} detail={`${kpis.externalPublicJobs} publika, ${kpis.externalInquiries} direkta förfrågningar`} />
        <StatTile label="Offerter från frilansare" value={kpis.realOffers} detail={`${kpis.realOffersOnInternalJobs} på dina uppdrag, ${kpis.realOffersOnExternalJobs} på kunders · ${kpis.providersWhoOffered} frilansare`} />
        <StatTile label="Affärer" value={kpis.wonDeals} detail="Accepterade offerter på kunders uppdrag" />
        <StatTile label="Tjänster" value={kpis.services} detail={`${kpis.realMessages} chattmeddelanden · ${kpis.reviews} recensioner`} />
      </div>

      <div className="mt-12 space-y-12">
        <Section id="att-gora" title="Att uppmärksamma">
          <Alerts alerts={data.alerts} />
        </Section>

        <Section id="dina-uppdrag" title="Dina uppdrag: får de svar?" description="Uppdrag som publicerats från interna konton, med offerterna de fått och hur många frilansare som fått mejl om dem.">
          <JobActivity jobs={data.internalJobs} empty="Inga uppdrag från interna konton. Lägg till e-postadresserna till kontona som publicerade dem i INTERNAL_EMAILS (adressen står på varje uppdrag nedan)." />
        </Section>

        <Section id="kunders-uppdrag" title="Uppdrag och förfrågningar från kunder" description="Riktig efterfrågan: publika uppdrag och direkta förfrågningar till en frilansare.">
          <JobActivity jobs={data.externalJobs} empty="Inga uppdrag eller förfrågningar från riktiga kunder ännu." />
        </Section>

        <Section id="tratt" title="Tratt" description="Hur långt användarna kommer. Procenten är andelen av steget ovanför.">
          <div className="grid gap-3 md:grid-cols-2">
            <Funnel title="Frilansare" steps={data.funnels.providers} />
            <Funnel title="Kunders uppdrag" steps={data.funnels.customers} />
          </div>
        </Section>

        <Section id="anvandare" title="Användare" description="Nyast först. Saknas visar vad som fattas i profilen.">
          <Table caption="Användare">
            <thead><tr>
              <th className={th}>Namn</th><th className={th}>Roll</th><th className={th}>Registrerad</th><th className={th}>Senast inloggad</th>
              <th className={`${th} ${num}`}>Tjänster</th><th className={`${th} ${num}`}>Offerter</th><th className={`${th} ${num}`}>Uppdrag</th><th className={th}>Saknas</th>
            </tr></thead>
            <tbody>
              {data.people.map(person => (
                <tr key={person.id}>
                  <td className={td}>
                    <Link href={`/profile/${person.id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{person.name}</Link>
                    {person.internal && <Badge className="ml-2">Intern</Badge>}
                    <div className="text-xs text-slate-500">{person.email ?? '–'} · {person.signInMethod}</div>
                    {person.noLogin
                      ? <div className="text-xs font-semibold text-slate-500">Saknar fungerande inloggning</div>
                      : !person.emailConfirmed && <div className="text-xs font-semibold text-amber-800">E-post ej bekräftad</div>}
                  </td>
                  <td className={td}>{person.role === 'customer' ? 'Köpare' : 'Frilansare'}{person.jobEmails === false && <div className="text-xs text-slate-500">Uppdragsmejl av</div>}</td>
                  <td className={`${td} whitespace-nowrap`}>{when(person.createdAt)}</td>
                  <td className={`${td} whitespace-nowrap`}>{when(person.lastSignInAt)}</td>
                  <td className={`${td} ${num}`}>{person.services}</td>
                  <td className={`${td} ${num}`}>{person.offers}</td>
                  <td className={`${td} ${num}`}>{person.jobs}</td>
                  <td className={`${td} text-xs`}>{person.missing.length ? person.missing.join(', ') : <span className="text-emerald-700">Komplett</span>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section id="kategorier" title="Utbud och efterfrågan per kategori" description="Tjänster och frilansare är utbudet, uppdrag är efterfrågan. Bevakar = frilansare som får mejl om nya uppdrag i kategorin.">
          <Table caption="Utbud och efterfrågan per kategori">
            <thead><tr>
              <th className={th}>Kategori</th><th className={`${th} ${num}`}>Tjänster</th><th className={`${th} ${num}`}>Frilansare</th><th className={`${th} ${num}`}>Bevakar</th>
              <th className={`${th} ${num}`}>Kunders uppdrag</th><th className={`${th} ${num}`}>Dina uppdrag</th><th className={`${th} ${num}`}>Offerter</th>
            </tr></thead>
            <tbody>
              {data.categories.map(row => (
                <tr key={row.category ?? 'ingen'}>
                  <td className={td}>{getCategoryLabel(row.category)}</td>
                  <td className={`${td} ${num}`}>{row.services}</td>
                  <td className={`${td} ${num}`}>{row.providers}</td>
                  <td className={`${td} ${num}`}>{row.subscribers}</td>
                  <td className={`${td} ${num}`}>{row.externalJobs}</td>
                  <td className={`${td} ${num}`}>{row.internalJobs}</td>
                  <td className={`${td} ${num}`}>{row.offers}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section id="veckor" title="Vecka för vecka" description="De senaste åtta veckorna, utan interna konton. Veckan börjar på måndag.">
          <Table caption="Aktivitet per vecka">
            <thead><tr>
              <th className={th}>Vecka från</th><th className={`${th} ${num}`}>Nya köpare</th><th className={`${th} ${num}`}>Nya frilansare</th><th className={`${th} ${num}`}>Kunders uppdrag</th>
              <th className={`${th} ${num}`}>Tjänster</th><th className={`${th} ${num}`}>Offerter</th><th className={`${th} ${num}`}>Meddelanden</th>
            </tr></thead>
            <tbody>
              {[...data.weekly].reverse().map(week => (
                <tr key={week.start}>
                  <td className={td}>{day(week.start)}</td>
                  <td className={`${td} ${num}`}>{week.customers}</td>
                  <td className={`${td} ${num}`}>{week.providers}</td>
                  <td className={`${td} ${num}`}>{week.jobs}</td>
                  <td className={`${td} ${num}`}>{week.services}</td>
                  <td className={`${td} ${num}`}>{week.offers}</td>
                  <td className={`${td} ${num}`}>{week.messages}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>

        <Section id="tjanster" title="Tjänster" description="Förfrågningar = hur många kunder som klickat Skicka förfrågan på tjänsten.">
          {data.services.length === 0 ? <p className="surface p-5 text-sm text-slate-600">Inga tjänster ännu.</p> : (
            <Table caption="Tjänster">
              <thead><tr>
                <th className={th}>Tjänst</th><th className={th}>Frilansare</th><th className={th}>Kategori</th>
                <th className={`${th} ${num}`}>Pris</th><th className={th}>Publicerad</th><th className={`${th} ${num}`}>Förfrågningar</th>
              </tr></thead>
              <tbody>
                {data.services.map(service => (
                  <tr key={service.id}>
                    <td className={td}><Link href={`/services/${service.id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{service.title}</Link></td>
                    <td className={td}>{service.providerName}{service.internal && <Badge className="ml-2">Intern</Badge>}</td>
                    <td className={td}>{getCategoryLabel(service.category)}</td>
                    <td className={`${td} ${num} whitespace-nowrap`}>{formatCurrency(service.price)}</td>
                    <td className={`${td} whitespace-nowrap`}>{when(service.createdAt)}</td>
                    <td className={`${td} ${num}`}>{service.inquiries}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Section>

        <Section id="handelser" title="Senaste händelser" description="De 60 senaste händelserna. Chattmeddelanden slås ihop per konversation och dag, och innehållet visas inte.">
          <ol className="surface divide-y divide-slate-100">
            {data.events.map((event, index) => (
              <li key={`${event.at}-${index}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3 text-sm">
                <time className="w-32 shrink-0 tabular-nums text-xs text-slate-500">{when(event.at)}</time>
                <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">{EVENT_LABEL[event.kind]}</span>
                <span className="min-w-0 flex-1 text-slate-700">
                  {event.href ? <Link href={event.href} className="hover:text-accent-strong">{event.text}</Link> : event.text}
                  {event.internal && <Badge className="ml-2">Intern</Badge>}
                </span>
              </li>
            ))}
            {data.events.length === 0 && <li className="px-5 py-4 text-sm text-slate-600">Inga händelser ännu.</li>}
          </ol>
        </Section>

        <Section id="mejl" title="Mejlnotiser" description={`Notiskön som skickar mejl om uppdrag, offerter och meddelanden. ${providers.filter(p => p.jobEmails !== false).length} av ${providers.length} frilansare tar emot mejl om nya uppdrag.`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Skickade senaste 7 dagarna" value={data.notifications.sent7d} />
            <StatTile label="I kö" value={data.notifications.pending} detail={data.notifications.oldestPending ? `Äldsta från ${when(data.notifications.oldestPending)}` : undefined} />
            <StatTile label="Försöks igen" value={data.notifications.retrying} emphasis={data.notifications.retrying ? 'warning' : undefined} />
            <StatTile label="Misslyckade" value={data.notifications.failed} emphasis={data.notifications.failed ? 'warning' : undefined} />
          </div>
        </Section>
      </div>
    </div>
  )
}
