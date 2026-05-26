import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategoryEmoji, getCategoryLabel } from '@/lib/categories'
import HeroVideo from '@/components/hero/HeroVideo'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, customer:users(name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="bg-neutral-50">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[94vh] flex items-center">
        <HeroVideo src="/Herovid2_opt.mp4" />

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-black/30" />

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-40 text-center">

          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-widest uppercase border border-white/30 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Gratis att komma igång
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight leading-[1.02] mb-6 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Hitta jobb<br />
            <span className="text-white/70">i Göteborg</span>
          </h1>

          <p className="text-lg md:text-2xl text-white/90 max-w-xl mx-auto mb-4 leading-relaxed font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            Göteborgs enklaste jobbsajt.
          </p>
          <p className="text-sm md:text-base text-white/70 max-w-lg mx-auto mb-12 leading-relaxed font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            Skapa en profil en gång och ansök på sekunder. Städ, café, restaurang, lager och mer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-neutral-900 text-sm font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto shadow-xl shadow-black/30"
            >
              Hitta jobb nu
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/jobs/create"
              className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-8 py-4 rounded-2xl border border-white/40 hover:bg-white/15 hover:border-white/60 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto backdrop-blur-sm"
            >
              Lägg upp jobb gratis
            </Link>
          </div>

          <p className="mt-10 text-xs text-white/60 tracking-wide font-medium">
            Ingen bindningstid &nbsp;·&nbsp; Inga avgifter &nbsp;·&nbsp; Publiceras direkt
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
      <section className="py-28 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">Hur det fungerar</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Tre steg till jobb
            </h2>
            <p className="mt-4 text-gray-600 font-medium max-w-md mx-auto">Enkelt, snabbt och utan krångel.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'Hitta ett jobb',
                desc: 'Bläddra bland jobb i Göteborg. Filtrera på kategori, arbetstid och område.',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                  </svg>
                ),
              },
              {
                n: '02',
                title: 'Skapa din profil',
                desc: 'Lägg till bild och erfarenhet en gång. Din profil återanvänds automatiskt vid ansökan.',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                n: '03',
                title: 'Ansök och börja jobba',
                desc: 'Skicka ansökan på sekunder. Arbetsgivaren kontaktar dig direkt.',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
            ].map(({ n, title, desc, icon }) => (
              <div
                key={n}
                className="group bg-white/95 rounded-3xl p-8 border border-neutral-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-7">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:bg-blue-500 transition-colors">
                    {icon}
                  </div>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-400 text-xs font-bold tracking-wide">
                    {n}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Senaste jobb ─────────────────────────────────────── */}
      {jobs && jobs.length > 0 && (
        <section className="py-24 px-4 bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-2">Jobb</p>
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Senaste jobben</h2>
              </div>
              <Link href="/jobs" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 group">
                Se alla
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job: any) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="group block">
                  <div className="bg-white border border-neutral-300 rounded-2xl p-6 h-full hover:border-neutral-500 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{getCategoryEmoji(job.category)}</span>
                        <h3 className="font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2 leading-snug">
                          {job.title}
                        </h3>
                      </div>
                      {job.salary && (
                        <span className="text-sm font-bold text-neutral-900 shrink-0 bg-neutral-100 px-2.5 py-1 rounded-lg">
                          {job.salary}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-5 leading-relaxed font-medium">{job.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate font-medium">{job.employer_name || job.customer?.name}</span>
                      {job.location && (
                        <span className="ml-auto shrink-0 bg-neutral-100 text-neutral-600 font-medium px-2 py-0.5 rounded-md">
                          📍 {job.location}
                        </span>
                      )}
                      {job.category && !job.location && (
                        <span className="ml-auto shrink-0 bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-md">
                          {getCategoryLabel(job.category)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div
            className="relative overflow-hidden rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: "url('/cta-bg.png')" }}
          >
            <div className="absolute inset-0 bg-neutral-950/65" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            <div className="relative px-8 py-20 sm:px-16 sm:py-24 text-center">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-5">Kom igång idag</p>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.02] mb-6">
                Behöver du personal<br />
                <span className="text-white/55">snabbt?</span>
              </h2>
              <p className="text-white/60 mb-10 max-w-md mx-auto leading-relaxed text-base">
                Lägg upp ett jobb gratis och nå tusentals jobbsökare i Göteborg. Publiceras direkt.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/jobs/create"
                  className="inline-flex items-center justify-center gap-2.5 bg-white text-neutral-900 text-sm font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto shadow-xl shadow-black/30"
                >
                  Lägg upp jobb gratis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center text-sm font-medium text-white/70 hover:text-white transition-colors px-8 py-4 w-full sm:w-auto"
                >
                  Hitta jobb
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
