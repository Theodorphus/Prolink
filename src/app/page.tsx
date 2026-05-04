import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeroVideo from '@/components/hero/HeroVideo'
import TaskCard, { type TaskCardJob } from '@/components/TaskCard'
import ServiceCard, { type ServiceCardService } from '@/components/ServiceCard'
import StepCard from '@/components/StepCard'
import CategoryCard from '@/components/CategoryCard'

// ── Icons ─────────────────────────────────────────────────────────────────────

function ArrowRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Webbutveckling', icon: '💻', color: 'bg-blue-50',    href: '/jobs?category=webb' },
  { label: 'Design',         icon: '🎨', color: 'bg-pink-50',    href: '/jobs?category=design' },
  { label: 'Ekonomi',        icon: '📊', color: 'bg-emerald-50', href: '/jobs?category=ekonomi' },
  { label: 'Marknadsföring', icon: '📣', color: 'bg-orange-50',  href: '/jobs?category=marknad' },
  { label: 'Städ & service', icon: '🧹', color: 'bg-sky-50',     href: '/jobs?category=stad' },
  { label: 'Foto & video',   icon: '📷', color: 'bg-violet-50',  href: '/jobs?category=foto' },
  { label: 'Administration', icon: '🗂️', color: 'bg-amber-50',   href: '/jobs?category=admin' },
  { label: 'Övrigt',         icon: '✨', color: 'bg-neutral-100', href: '/jobs' },
]

const TRUST_ITEMS = [
  { icon: '🚀', title: 'Kom igång direkt',    desc: 'Lägg ut ett uppdrag på under en minut och få offerter snabbt.' },
  { icon: '🚫', title: 'Helt gratis',         desc: 'Det kostar ingenting att använda Prolink – varken för kunder eller leverantörer.' },
  { icon: '💬', title: 'Support vid problem', desc: 'Vårt team finns tillgängligt om något inte fungerar som förväntat.' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: rawJobs }, { data: rawServices }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, customer:users(name, avatar_url), offers(count)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('services')
      .select('*, provider:users(name, avatar_url), reviews(rating)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const jobs: TaskCardJob[] = (rawJobs ?? []).map((job: any) => ({
    ...job,
    offer_count: Array.isArray(job.offers) ? job.offers[0]?.count ?? 0 : 0,
  }))

  const services: ServiceCardService[] = (rawServices ?? []).map((svc: any) => {
    const ratings: number[] = Array.isArray(svc.reviews)
      ? svc.reviews.map((r: any) => r.rating).filter(Boolean)
      : []
    return {
      ...svc,
      rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0,
      review_count: ratings.length,
    }
  })

  return (
    <div className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-screen flex items-center">

        {/* Video background — full bleed */}
        <HeroVideo src="/Herovid2_opt.mp4" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-40 text-center">

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Helt gratis att komma igång
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04] mb-6">
            Hitta rätt expert<br />
            <span className="text-white/60">för ditt uppdrag</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-10 max-w-xl mx-auto font-medium">
            Prolink matchar dig med kvalificerade leverantörer – snabbt, tryggt och helt gratis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/jobs/create"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-neutral-900 text-sm font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 shadow-2xl shadow-black/40 w-full sm:w-auto"
            >
              Lägg ut uppdrag
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-8 py-4 rounded-2xl border border-white/30 hover:bg-white/10 hover:border-white/50 active:scale-[0.98] transition-all duration-150 backdrop-blur-sm w-full sm:w-auto"
            >
              Bläddra uppdrag
            </Link>
          </div>

        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/30">
          <span className="text-[10px] tracking-[0.2em] uppercase">Scrolla</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── KATEGORIER ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-2">Kategorier</p>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Utforska kategorier</h2>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-neutral-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 group shrink-0">
              Se alla
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.label} label={cat.label} href={cat.href} icon={cat.icon} color={cat.color} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HUR DET FUNGERAR ─────────────────────────────────────────────── */}
      <section className="py-28 px-4 bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">Hur det fungerar</p>
            <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 tracking-tight">Tre steg till leverans</h2>
            <p className="mt-4 text-neutral-500 font-medium max-w-md mx-auto">Enkelt, snabbt och utan krångel.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <StepCard
              step="01"
              emoji="📝"
              title="Beskriv ditt uppdrag"
              description="Lägg ut vad du behöver på under en minut. Skriv en titel, kort beskrivning och ange en budget om du vill."
              badge="Tar < 1 minut"
              iconBg="bg-blue-50"
              iconRing="ring-blue-100"
            />
            <StepCard
              step="02"
              emoji="📩"
              title="Få offerter från kvalificerade leverantörer"
              description="Leverantörer skickar offerter med pris, tidsplan och förslag på lösning. Du får allt samlat på ett ställe."
              badge="Allt samlat på ett ställe"
              iconBg="bg-violet-50"
              iconRing="ring-violet-100"
            />
            <StepCard
              step="03"
              emoji="✅"
              title="Välj leverantör och starta arbetet"
              description="Acceptera den bästa offerten och chatta direkt i plattformen. Bekräfta leveransen när arbetet är klart."
              badge="Helt gratis"
              iconBg="bg-emerald-50"
              iconRing="ring-emerald-100"
            />
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {TRUST_ITEMS.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">{title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SENASTE UPPDRAG ──────────────────────────────────────────────── */}
      {jobs.length > 0 && (
        <section className="py-24 px-4 bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-2">Uppdrag</p>
                <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 tracking-tight">Senaste uppdragen</h2>
                <p className="mt-1 text-sm text-neutral-500">Färska uppdrag som väntar på din offert</p>
              </div>
              <Link href="/jobs" className="text-sm font-semibold text-neutral-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 group shrink-0">
                Se alla uppdrag
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <TaskCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── POPULÄRA TJÄNSTER ────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="py-24 px-4 bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-2">Tjänster</p>
                <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 tracking-tight">Populära tjänster</h2>
                <p className="mt-1 text-sm text-neutral-500">Hitta rätt expertis för ditt nästa projekt</p>
              </div>
              <Link href="/services" className="text-sm font-semibold text-neutral-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 group shrink-0">
                Bläddra alla tjänster
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/cta-bg.png')" }}
      >
        <div className="absolute inset-0 bg-neutral-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative px-4 py-24 sm:px-16 sm:py-28 text-center">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-5">Kom igång idag</p>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.04] mb-5">
            Redo att komma igång?
          </h2>
          <p className="text-white/60 mb-10 max-w-md mx-auto leading-relaxed text-base">
            Registrera dig gratis och publicera dina tjänster eller ditt första uppdrag på under en minut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-neutral-900 text-sm font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto shadow-2xl shadow-black/40"
            >
              Skapa konto gratis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/jobs/create"
              className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-8 py-4 rounded-2xl border border-white/30 hover:bg-white/10 hover:border-white/50 active:scale-[0.98] transition-all duration-150 backdrop-blur-sm w-full sm:w-auto"
            >
              Lägg ut uppdrag
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
