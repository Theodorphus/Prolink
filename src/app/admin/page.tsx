import type { Metadata } from 'next'
import Link from 'next/link'
import { loadAdminInsights, loadTrustReview, requireAdmin } from '@/lib/admin'
import { reviewCompanyVerification } from './actions'
import { formatOrgNumber } from '@/lib/trust.mjs'
import { getCategoryLabel } from '@/lib/categories'
import { formatCurrency } from '@/lib/utils'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Alerts, Funnel, JobActivity, RecentList, Section, StatTile, Table, day, num, td, th, when } from '@/components/admin/AdminUi'

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } }

const EVENT_LABEL = {
  user: 'Konto', job: 'Uppdrag', inquiry: 'Förfrågan', offer: 'Offert', service: 'Tjänst', review: 'Recension', message: 'Chatt',
} as const

const NAV = [
  ['senaste', 'Senaste aktivitet'], ['att-gora', 'Att uppmärksamma'], ['verifiering', 'Verifiering'], ['dina-uppdrag', 'Dina uppdrag'], ['kunders-uppdrag', 'Kunders uppdrag'],
  ['tratt', 'Tratt'], ['anvandare', 'Användare'], ['kategorier', 'Kategorier'], ['veckor', 'Veckor'],
  ['tjanster', 'Tjänster'], ['handelser', 'Händelser'], ['mejl', 'Mejlnotiser'],
] as const

export default async function AdminPage() {
  await requireAdmin()
  const [data, trust] = await Promise.all([loadAdminInsights(), loadTrustReview()])
  const pendingVerifications = trust.verifications.filter(row => row.status === 'pending')
  const { kpis, recent } = data
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
        <Section id="senaste" title="Senaste aktivitet" description="Det senaste av varje slag, interna konton märkta. Siffrorna gäller senaste sju dagarna utan interna konton. Meddelandenas innehåll visas inte.">
          <div className="grid gap-3 lg:grid-cols-3">
            <RecentList title="Registreringar" count={recent.signups7d} empty="Inga konton ännu.">
              {recent.signups.map(person => (
                <li key={person.id} className="px-4 py-3 text-sm">
                  <Link href={`/profile/${person.id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{person.name}</Link>
                  {person.internal && <Badge className="ml-2">Intern</Badge>}
                  <div className="text-xs text-slate-500">{person.role === 'customer' ? 'Köpare' : 'Frilansare'} · {person.email ?? '–'}</div>
                  <time className="text-xs tabular-nums text-slate-500">{when(person.createdAt)}</time>
                </li>
              ))}
            </RecentList>
            <RecentList title="Offerter" count={recent.offers7d} empty="Inga offerter har skickats ännu.">
              {recent.offers.map(offer => (
                <li key={offer.id} className="px-4 py-3 text-sm">
                  <Link href={`/profile/${offer.providerId}`} className="font-semibold text-slate-900 hover:text-accent-strong">{offer.providerName}</Link>
                  {offer.internal && <Badge className="ml-2">Intern</Badge>}
                  <div className="text-xs text-slate-500">
                    på <Link href={`/jobs/${offer.jobId}`} className="hover:text-accent-strong">{offer.jobTitle}</Link> ({offer.customerName}) · {formatCurrency(offer.price)}{offer.priceType === 'hourly' ? '/tim' : ''}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <time className="tabular-nums">{when(offer.createdAt)}</time>
                    {offer.status === 'pending' && <span className={offer.customerRead ? undefined : 'font-semibold text-amber-800'}>{offer.customerRead ? 'Läst av kunden' : 'Oläst av kunden'}</span>}
                    <StatusBadge status={offer.status} />
                  </div>
                </li>
              ))}
            </RecentList>
            <RecentList title="Meddelanden" count={recent.messages7d} empty="Inga chattmeddelanden har skickats ännu.">
              {recent.conversations.map((conversation, index) => (
                <li key={`${conversation.at}-${index}`} className="px-4 py-3 text-sm">
                  <span className="text-slate-700">{conversation.text}</span>
                  {conversation.internal && <Badge className="ml-2">Intern</Badge>}
                  <div><time className="text-xs tabular-nums text-slate-500">{when(conversation.at)}</time></div>
                </li>
              ))}
            </RecentList>
          </div>
        </Section>

        <Section id="att-gora" title="Att uppmärksamma">
          <Alerts alerts={pendingVerifications.length
            ? [{ level: 'warning', text: `${pendingVerifications.length} ${pendingVerifications.length === 1 ? 'frilansare väntar' : 'frilansare väntar'} på företagsverifiering. Se Verifiering nedan.` }, ...data.alerts]
            : data.alerts} />
        </Section>

        <Section id="verifiering" title="Verifiering och referenser" description={`Referensförfrågningar: ${trust.referencesSent} skickade av ${trust.providersAsking} frilansare, ${trust.referencesAnswered} besvarade. Företag: kontrollera namn och status på Bolagsverket (eller allabolag.se) och F-skatt på Skatteverket innan du godkänner. Organisationsnumret visas bara här.`}>
          {trust.verifications.length === 0 ? <p className="surface p-5 text-sm text-slate-600">Ingen har skickat in företagsuppgifter ännu.</p> : (
            <ul className="space-y-3">
              {trust.verifications.map(row => (
                <li key={row.user_id} className="surface p-5 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/profile/${row.user_id}`} className="font-semibold text-slate-900 hover:text-accent-strong">{row.name}</Link>
                      <p className="mt-1 text-slate-700">{row.company_name} · <span className="tabular-nums">{formatOrgNumber(row.org_number)}</span> · {row.f_skatt ? 'Uppger F-skatt' : 'Uppger inte F-skatt'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Inskickad {when(row.submitted_at)}{row.reviewed_at ? ` · granskad ${when(row.reviewed_at)}` : ''}
                        {' · '}<a href={`https://www.google.com/search?q=${encodeURIComponent(row.org_number.slice(0, 6) + '-' + row.org_number.slice(6))}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Sök organisationsnumret</a>
                      </p>
                      {row.review_note && <p className="mt-1 text-xs text-red-700">{row.review_note}</p>}
                    </div>
                    <Badge variant={row.status === 'verified' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'}>
                      {row.status === 'verified' ? 'Verifierad' : row.status === 'rejected' ? 'Avslagen' : 'Väntar'}
                    </Badge>
                  </div>
                  {row.status !== 'verified' && (
                    <form action={reviewCompanyVerification} className="mt-4 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="user_id" value={row.user_id} />
                      <button name="decision" value="verified" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Godkänn</button>
                      <input name="note" maxLength={500} placeholder="Skäl vid avslag (visas för frilansaren)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs" />
                      <button name="decision" value="rejected" className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">Avslå</button>
                    </form>
                  )}
                  {row.status === 'verified' && (
                    <form action={reviewCompanyVerification} className="mt-3">
                      <input type="hidden" name="user_id" value={row.user_id} />
                      <input type="hidden" name="note" value="Verifieringen har återkallats." />
                      <button name="decision" value="rejected" className="text-xs font-semibold text-slate-500 hover:text-red-700">Återkalla märket</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
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
