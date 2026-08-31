import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { CATEGORIES, getCategoryEmoji, getCategoryLabel } from '@/lib/categories'
import { formatCurrency } from '@/lib/utils'
import type { PublicJob, User } from '@/types/database'

type FeaturedJob = PublicJob & { customer: Pick<User, 'name'> | null }

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select(`${PUBLIC_JOB_FIELDS}, customer:users(name)`).eq('status', 'open').order('created_at', { ascending: false }).limit(6)

  // Supabase typar den inbäddade relationen som en array eftersom FK-relationen
  // saknas i de handunderhållna typerna. Varje uppdrag har exakt en kund.
  const jobs: FeaturedJob[] = (data ?? []).map(row => ({
    ...row,
    customer: Array.isArray(row.customer) ? row.customer[0] ?? null : row.customer,
  })) as FeaturedJob[]

  return (
    <div className="bg-[#f5f7fb] text-slate-950">
      <section className="premium-hero relative overflow-hidden border-b border-white/10 text-white">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="mesh-orb mesh-orb-one" />
        <div className="mesh-orb mesh-orb-two" />
        <div className="relative mx-auto grid min-h-[780px] max-w-7xl items-center gap-16 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pb-28 lg:pt-36">
          <div className="reveal-up">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 shadow-xl backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Svenska uppdrag. Rätt kompetens.
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-[5.25rem]">Få jobbet gjort.<span className="gradient-text mt-2 block">Hitta nästa kund.</span></h1>
            <p className="mt-8 max-w-2xl text-lg font-medium leading-8 text-slate-300 sm:text-xl">Prolink samlar företag som behöver hjälp och frilansare som kan leverera—från webb och design till redovisning, marknadsföring och IT.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/jobs/create" className="glow-button inline-flex items-center justify-center rounded-xl bg-blue-500 px-7 py-4 text-sm font-bold text-white shadow-2xl shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-400">Publicera ett uppdrag <span aria-hidden className="ml-2">→</span></Link>
              <Link href="/jobs" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] px-7 py-4 text-sm font-bold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10">Hitta uppdrag</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-400"><span>✓ Gratis att komma igång</span><span>✓ Direktkontakt</span><span>✓ Offerter på ett ställe</span></div>
          </div>
          <div className="float-card relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -inset-7 rotate-2 rounded-[2.75rem] bg-gradient-to-br from-blue-500/20 to-violet-500/10 blur-sm" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.09] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Så går det till</p>
                  <p className="mt-1 text-sm text-slate-400">Från brief till klar leverans</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl text-blue-200" aria-hidden>✦</div>
              </div>

              <ol className="space-y-3">
                {[
                  ['Du beskriver uppdraget', 'Behov, budget och tidsram i ett formulär.'],
                  ['Frilansare lämnar offert', 'Du jämför pris, upplägg och tidigare omdömen.'],
                  ['Ni gör klart i Prolink', 'Chatt, leverans och omdöme på samma ställe.'],
                ].map(([title, copy], index) => (
                  <li key={title} className="flex gap-3.5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-black text-blue-200" aria-hidden>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-5 border-t border-white/10 pt-4 text-center text-xs font-medium text-slate-400">
                Kostnadsfritt att publicera. Inga bindningstider.
              </p>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-white/[0.035] py-4 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45"><span>Webbutveckling</span><span>Design</span><span>Marknadsföring</span><span>Redovisning</span><span>IT & support</span></div></div>
      </section>

      <section className="border-b border-slate-200/80 bg-white px-4 py-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Kompetens för småföretag</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Vad behöver du hjälp med?</h2></div><Link href="/services" className="text-sm font-bold text-slate-600 transition hover:text-blue-600">Se alla tjänster →</Link></div><div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{CATEGORIES.filter(category => category.value !== 'annat').map(category => <Link key={category.value} href={`/jobs?category=${category.value}`} className="premium-card group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700" aria-hidden>{category.emoji}</span><p className="mt-5 font-bold tracking-tight group-hover:text-blue-600">{category.label}</p><p className="mt-1 text-xs font-medium text-slate-500">Hitta specialist →</p></Link>)}</div></div></section>

      <section className="px-4 py-28 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Så fungerar Prolink</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Från behov till leverans</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">Slipp leta i flöden och kommentarsfält. Samla uppdrag, offerter och dialog på samma plats.</p></div><div className="mt-14 grid gap-4 md:grid-cols-3">{[['01','Beskriv uppdraget','Berätta vad du behöver, önskad budget och när det ska vara klart.'],['02','Jämför offerter','Ta emot förslag från relevanta frilansare och prata direkt i Prolink.'],['03','Välj och samarbeta','Välj rätt leverantör, följ leveransen och lämna ett omdöme.']].map(([number,title,copy]) => <article key={number} className="premium-card rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{number}</span><h3 className="mt-9 text-xl font-black tracking-tight">{title}</h3><p className="mt-3 text-sm font-medium leading-7 text-slate-600">{copy}</p></article>)}</div></div></section>

      {jobs.length > 0 && <section className="border-y border-slate-200 bg-white px-4 py-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Aktuellt just nu</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Senaste uppdragen</h2></div><Link href="/jobs" className="hidden text-sm font-bold text-slate-600 hover:text-blue-600 sm:block">Alla uppdrag →</Link></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{jobs.map(job => <Link key={job.id} href={`/jobs/${job.id}`} className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><span className="rounded-xl bg-blue-50 p-2.5 text-xl" aria-hidden>{getCategoryEmoji(job.category)}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{job.budget ? formatCurrency(job.budget) : 'Öppen budget'}</span></div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-600">{getCategoryLabel(job.category)}</p><h3 className="mt-2 line-clamp-2 text-lg font-black tracking-tight group-hover:text-blue-600">{job.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p><div className="mt-6 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">{job.customer?.name ?? 'Prolink-kund'} <span className="float-right text-blue-600">Visa uppdrag →</span></div></Link>)}</div></div></section>}

      <section className="px-4 py-24 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2"><div className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-12"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">För dig som köper tjänster</p><h2 className="mt-5 text-3xl font-black tracking-tight">Rätt hjälp utan ett stort nätverk.</h2><p className="mt-4 max-w-lg leading-7 text-slate-300">Publicera ditt behov en gång, jämför konkreta offerter och välj den kompetens som passar företaget.</p><Link href="/jobs/create" className="mt-8 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-slate-100">Skapa ett uppdrag</Link></div><div className="rounded-[2rem] bg-blue-600 p-8 text-white sm:p-12"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">För dig som säljer tjänster</p><h2 className="mt-5 text-3xl font-black tracking-tight">Låt nästa kund hitta dig.</h2><p className="mt-4 max-w-lg leading-7 text-blue-100">Visa vad du erbjuder, hitta relevanta uppdrag och bygg förtroende genom lyckade leveranser.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/services/create" className="inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 hover:bg-blue-50">Publicera en tjänst</Link><Link href="/jobs" className="inline-flex rounded-xl border border-white/40 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10">Se uppdrag</Link></div></div></div></section>
    </div>
  )
}
