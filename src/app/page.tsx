import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import HeroVideo from '@/components/hero/HeroVideo'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: services }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, customer:users(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('services')
      .select('*, provider:users(name)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="bg-neutral-50">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[94vh] flex items-center">
        <HeroVideo src="/HeroVid.mp4" />

        {/* Flerskiktat overlay för mer djup */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-40 text-center">

          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium px-4 py-2 rounded-full mb-10 tracking-widest uppercase border border-white/20 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Gratis att komma igång
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight leading-[1.02] mb-6">
            Hitta rätt<br />
            <span className="text-white/50">kompetens.</span>
          </h1>

          <p className="text-lg md:text-2xl text-white/65 max-w-xl mx-auto mb-4 leading-relaxed font-light">
            Sveriges marknadsplats för uppdrag och freelancers.
          </p>
          <p className="text-sm md:text-base text-white/40 max-w-lg mx-auto mb-12 leading-relaxed">
            Lägg ut ett uppdrag på minuter — kvalificerade leverantörer skickar offerter direkt till dig.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/jobs/create"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-neutral-900 text-sm font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto shadow-xl shadow-black/20"
            >
              Lägg ut uppdrag
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 text-white/80 text-sm font-semibold px-8 py-4 rounded-2xl border border-white/25 hover:bg-white/10 hover:border-white/40 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto backdrop-blur-sm"
            >
              Bläddra tjänster
            </Link>
          </div>

          <p className="mt-10 text-xs text-white/30 tracking-wide">
            Ingen bindningstid &nbsp;·&nbsp; Inga avgifter &nbsp;·&nbsp; Leverantören fakturerar direkt
          </p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30">
          <span className="text-[10px] tracking-[0.2em] uppercase">Scrolla</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Hur det fungerar ─────────────────────────────────── */}
      <section className="relative py-28 px-4 overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Hur det fungerar</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Tre steg till leverans
            </h2>
            <p className="mt-4 text-neutral-400 max-w-md mx-auto">Enkelt, snabbt och utan krångel.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'Beskriv uppdraget',
                desc: 'Lägg ut vad du behöver — titel, beskrivning och eventuell budget. Tar under en minut.',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                n: '02',
                title: 'Få offerter',
                desc: 'Kvalificerade leverantörer skickar offerter med pris och tidsplan direkt till dig.',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
              },
              {
                n: '03',
                title: 'Välj och leverera',
                desc: 'Acceptera den bästa offerten, chatta direkt och bekräfta när arbetet är klart.',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
            ].map(({ n, title, desc, icon }) => (
              <div
                key={n}
                className="group bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-7">
                  {/* Ikon i mörk container */}
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-md group-hover:bg-neutral-800 transition-colors">
                    {icon}
                  </div>
                  {/* Stegbadge */}
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 text-neutral-500 text-xs font-bold tracking-wide">
                    {n}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Senaste uppdrag ──────────────────────────────────── */}
      {jobs && jobs.length > 0 && (
        <section className="py-24 px-4 bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-2">Uppdrag</p>
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Senaste uppdragen</h2>
              </div>
              <Link href="/jobs" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5 group">
                Se alla
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job: any) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="group block">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 h-full hover:border-neutral-400 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2 leading-snug">
                        {job.title}
                      </h3>
                      {job.budget && (
                        <span className="text-sm font-bold text-neutral-900 shrink-0 bg-neutral-100 px-2.5 py-1 rounded-lg">
                          {formatCurrency(job.budget)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-2 mb-5 leading-relaxed">{job.description}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">{job.customer?.name}</span>
                      {!job.budget && <span className="ml-auto shrink-0">Öppen budget</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Populära tjänster ────────────────────────────────── */}
      {services && services.length > 0 && (
        <section className="py-24 px-4 bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-2">Tjänster</p>
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Populära tjänster</h2>
              </div>
              <Link href="/services" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5 group">
                Se alla
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service: any) => (
                <Link key={service.id} href={`/services/${service.id}`} className="group block">
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6 h-full hover:border-neutral-400 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2 leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed flex-1">{service.description}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-[10px]">
                          {service.provider?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="truncate max-w-[100px]">{service.provider?.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-neutral-900">{formatCurrency(service.price)}</span>
                        <p className="text-[11px] text-neutral-400">{service.delivery_time}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/cta-bg.png')" }}
        />
        <div className="absolute inset-0 bg-neutral-950/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-5">Kom igång idag</p>
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.02] mb-6">
            Redo att hitta din<br />
            <span className="text-white/55">nästa kund?</span>
          </h2>
          <p className="text-white/60 mb-12 max-w-md mx-auto leading-relaxed text-lg">
            Registrera dig gratis och publicera dina tjänster eller ditt första uppdrag på under en minut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-neutral-900 text-sm font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto shadow-xl shadow-black/30"
            >
              Skapa konto gratis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center text-sm font-medium text-white/50 hover:text-white transition-colors px-8 py-4 w-full sm:w-auto"
            >
              Bläddra uppdrag
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
