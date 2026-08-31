import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { CATEGORIES, PRIORITY_CATEGORIES } from '@/lib/categories'
import JobCard from '@/components/jobs/JobCard'
import type { PublicJob, User } from '@/types/database'

type FeaturedJob = PublicJob & { customer: Pick<User, 'name'> | null }

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users(name)`)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  // Supabase typar den inbäddade relationen som en array eftersom FK-relationen
  // saknas i de handunderhållna typerna. Varje uppdrag har exakt en kund.
  const jobs: FeaturedJob[] = (data ?? []).map(row => ({
    ...row,
    customer: Array.isArray(row.customer) ? row.customer[0] ?? null : row.customer,
  })) as FeaturedJob[]

  const priorityCategories = CATEGORIES.filter(category =>
    (PRIORITY_CATEGORIES as readonly string[]).includes(category.value)
  )
  const remainingCategories = CATEGORIES.filter(
    category =>
      category.value !== 'annat' &&
      !(PRIORITY_CATEGORIES as readonly string[]).includes(category.value)
  )

  return (
    <div className="bg-[#f5f7fb] text-slate-950">
      <section className="premium-hero relative overflow-hidden border-b border-white/10 text-white">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="mesh-orb mesh-orb-one" />
        <div className="mesh-orb mesh-orb-two" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-24 sm:px-6 lg:min-h-[720px] lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pb-28 lg:pt-32">
          <div className="reveal-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80 shadow-xl backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Svenska specialister. På distans.
            </div>

            {/* Rubriken är nedskalad på mobil så att ingressen och båda
                knapparna ryms ovanför vecket. */}
            <h1 className="max-w-3xl text-[2.5rem] font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl lg:text-[4.5rem] lg:leading-[0.98] lg:tracking-[-0.055em]">
              Hitta rätt specialist
              <span className="gradient-text mt-1.5 block">utan att leta i Facebook-grupper</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Beskriv vad ditt företag behöver och få offerter från svenska frilansare inom IT,
              ekonomi, juridik och marknadsföring. Kostnadsfritt att publicera.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs/create"
                className="glow-button inline-flex items-center justify-center rounded-xl bg-blue-500 px-7 py-4 text-sm font-bold text-white shadow-2xl shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-400"
              >
                Publicera ett uppdrag <span aria-hidden className="ml-2">→</span>
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] px-7 py-4 text-sm font-bold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
              >
                Utforska färdiga tjänster
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-400">
              <span>✓ Gratis att publicera</span>
              <span>✓ Direktkontakt</span>
              <span>✓ Offerter på ett ställe</span>
            </div>

            {/* Diskret frilansarspår. Ska inte konkurrera med köparflödet. */}
            <p className="mt-7 border-t border-white/10 pt-6 text-sm text-slate-400">
              Frilansare?{' '}
              <Link href="/register" className="font-semibold text-blue-300 underline-offset-4 hover:underline">
                Skapa en profil och hitta nya kunder
              </Link>
            </p>
          </div>

          <div className="float-card relative mx-auto hidden w-full max-w-xl lg:mx-0 lg:block">
            <div className="absolute -inset-7 rotate-2 rounded-[2.75rem] bg-gradient-to-br from-blue-500/20 to-violet-500/10 blur-sm" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.09] p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Så går det till</p>
                  <p className="mt-1 text-sm text-slate-400">Från brief till klar leverans</p>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl text-blue-200"
                  aria-hidden
                >
                  ✦
                </div>
              </div>

              <ol className="space-y-3">
                {[
                  ['Du beskriver uppdraget', 'Behov, budget och tidsram i ett formulär.'],
                  ['Frilansare lämnar offert', 'Du jämför pris, upplägg och tidigare omdömen.'],
                  ['Ni gör klart i Prolink', 'Chatt, leverans och omdöme på samma ställe.'],
                ].map(([title, copy], index) => (
                  <li key={title} className="flex gap-3.5 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-black text-blue-200"
                      aria-hidden
                    >
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

        <div className="relative border-t border-white/10 bg-white/[0.035] py-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
            <span>Webbutveckling</span>
            <span>Design</span>
            <span>Marknadsföring</span>
            <span>Ekonomi</span>
            <span>Juridik</span>
            <span>IT &amp; support</span>
          </div>
        </div>
      </section>

      {/* De två vägarna förklaras direkt efter hjälten, innan kategorierna, så
          att skillnaden mellan eget uppdrag och färdig tjänst är tydlig tidigt. */}
      <section className="border-b border-slate-200/80 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="page-eyebrow">Två vägar</p>
            <h2 className="page-heading mt-3 text-3xl sm:text-4xl">Välj det som passar ditt behov</h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="surface flex flex-col p-7 sm:p-8">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700"
                aria-hidden
              >
                ✎
              </span>
              <h3 className="mt-5 text-xl font-black tracking-[-0.025em]">Publicera ett uppdrag</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                Har du ett specifikt behov? Beskriv det en gång och låt frilansare komma till dig med
                förslag på upplägg, pris och tidplan. Du jämför offerterna och väljer själv vem du
                går vidare med.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Passar när behovet behöver anpassas
              </p>
              <Link
                href="/jobs/create"
                className="mt-6 inline-flex self-start rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg"
              >
                Beskriv ditt uppdrag
              </Link>
            </article>

            <article className="surface flex flex-col p-7 sm:p-8">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-700"
                aria-hidden
              >
                ◉
              </span>
              <h3 className="mt-5 text-xl font-black tracking-[-0.025em]">Utforska färdiga tjänster</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                Vet du redan vad du vill ha? Bläddra bland tjänster där frilansaren angett pris och
                leveranstid i förväg. Du ser omfattningen direkt och tar kontakt med den som passar.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Passar när omfattningen är tydlig
              </p>
              <Link
                href="/services"
                className="mt-6 inline-flex self-start rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                Se tjänster
              </Link>
            </article>
          </div>

          <p className="muted mt-6 text-sm">
            Oavsett väg sker allt i Prolink: dialog, leverans och omdöme. Betalningen kommer ni
            överens om direkt med varandra.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="page-eyebrow">Kompetens för småföretag</p>
              <h2 className="page-heading mt-3 text-3xl sm:text-4xl">Vad behöver du hjälp med?</h2>
            </div>
            <Link href="/services" className="text-sm font-bold text-slate-600 transition hover:text-blue-700">
              Se alla tjänster →
            </Link>
          </div>

          {/* Korten säger "Hitta specialist" och går därför till tjänstelistan,
              inte till uppdragslistan. */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {priorityCategories.map(category => (
              <Link
                key={category.value}
                href={`/services?category=${category.value}`}
                className="premium-card group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700"
                  aria-hidden
                >
                  {category.emoji}
                </span>
                <p className="mt-5 font-bold leading-snug tracking-tight group-hover:text-blue-700">
                  {category.label}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">Hitta specialist →</p>
              </Link>
            ))}

            {/* Resterande kategorier är dolda på mobil bakom detaljelementet
                nedan, men syns direkt från sm och uppåt. */}
            {remainingCategories.map(category => (
              <Link
                key={category.value}
                href={`/services?category=${category.value}`}
                className="premium-card group hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10 sm:block"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700"
                  aria-hidden
                >
                  {category.emoji}
                </span>
                <p className="mt-5 font-bold leading-snug tracking-tight group-hover:text-blue-700">
                  {category.label}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">Hitta specialist →</p>
              </Link>
            ))}
          </div>

          <details className="group mt-4 sm:hidden">
            <summary className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm marker:content-none">
              <span className="group-open:hidden">Visa alla kategorier</span>
              <span className="hidden group-open:inline">Visa färre</span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {remainingCategories.map(category => (
                <Link
                  key={category.value}
                  href={`/services?category=${category.value}`}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700"
                    aria-hidden
                  >
                    {category.emoji}
                  </span>
                  <p className="mt-5 font-bold leading-snug tracking-tight">{category.label}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Hitta specialist →</p>
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>

      {jobs.length > 0 && (
        <section className="border-b border-slate-200 bg-[#f5f7fb] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="page-eyebrow">Aktuellt just nu</p>
                <h2 className="page-heading mt-3 text-3xl sm:text-4xl">Senaste uppdragen</h2>
              </div>
              <Link href="/jobs" className="hidden text-sm font-bold text-slate-600 hover:text-blue-700 sm:block">
                Alla uppdrag →
              </Link>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  // Bara två uppdrag visas på mobil för att hålla sidan kort.
                  className={index >= 2 ? 'hidden md:block' : undefined}
                >
                  <JobCard job={job} />
                </div>
              ))}
            </div>

            {/* Samma länk behövs på mobil, där rubrikens länk är dold. */}
            <Link
              href="/jobs"
              className="mt-6 flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm sm:hidden"
            >
              Alla uppdrag →
            </Link>
          </div>
        </section>
      )}

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              För dig som köper tjänster
            </p>
            <h2 className="mt-5 text-3xl font-black tracking-tight">Rätt hjälp utan ett stort nätverk.</h2>
            <p className="mt-4 max-w-lg leading-7 text-slate-300">
              Publicera ditt behov en gång, jämför konkreta offerter och välj den kompetens som
              passar företaget.
            </p>
            <Link
              href="/jobs/create"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-slate-100"
            >
              Skapa ett uppdrag
            </Link>
          </div>

          <div className="rounded-[2rem] bg-blue-600 p-8 text-white sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              För dig som säljer tjänster
            </p>
            <h2 className="mt-5 text-3xl font-black tracking-tight">Låt nästa kund hitta dig.</h2>
            <p className="mt-4 max-w-lg leading-7 text-blue-100">
              Visa vad du erbjuder, hitta relevanta uppdrag och bygg förtroende genom lyckade
              leveranser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services/create"
                className="inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 hover:bg-blue-50"
              >
                Publicera en tjänst
              </Link>
              <Link
                href="/jobs"
                className="inline-flex rounded-xl border border-white/40 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10"
              >
                Se uppdrag
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
