import Link from 'next/link'
import HeroIllustration from '@/components/home/HeroIllustration'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 text-white">
      {/* Mörk botten med mesh-gradienter. Gradienterna ligger i separata lager
          så att de kan röra sig oberoende av innehållet. */}
      <div className="absolute inset-0" style={{ background: 'var(--gradient-ink)' }} />
      <div
        className="mesh mesh-drift"
        style={{ width: '30rem', height: '30rem', right: '-6rem', top: '-4rem', background: 'rgba(99,102,241,.45)' }}
      />
      <div
        className="mesh mesh-drift"
        style={{ width: '24rem', height: '24rem', left: '-4rem', bottom: '-8rem', background: 'rgba(45,212,191,.22)', animationDelay: '-7s' }}
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, black, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-24 sm:px-6 lg:min-h-[42rem] lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-28">
        <div>
          <p className="reveal glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-300" aria-hidden />
            Svenska specialister · På distans
          </p>

          {/* 48–64px på desktop, nedskalad på mobil så ingressen och båda
              knapparna ryms ovanför vecket. */}
          <h1 className="reveal reveal-1 mt-7 max-w-[16ch] text-[2.75rem] font-extrabold leading-[1.04] tracking-[-0.042em] sm:text-[3.5rem] lg:text-[4rem]">
            Hitta rätt frilansare för ditt företag
          </h1>

          <p className="reveal reveal-2 mt-6 max-w-xl text-lg font-medium leading-8 text-slate-300">
            Snabbt, enkelt och kostnadsfritt. Beskriv vad ni behöver och få offerter från svenska
            specialister inom IT, ekonomi, juridik och marknadsföring.
          </p>

          <div className="reveal reveal-3 mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jobs/create"
              className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-accent)' }}
            >
              Publicera uppdrag
              <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
                →
              </span>
            </Link>
            <Link
              href="/services"
              className="glass inline-flex items-center justify-center rounded-xl px-7 py-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14]"
            >
              Utforska tjänster
            </Link>
          </div>

          <ul className="reveal reveal-4 mt-9 flex flex-wrap gap-x-7 gap-y-2.5 text-sm font-semibold text-slate-400">
            {['Kostnadsfritt att publicera', 'Direktkontakt utan mellanhand', 'Alla offerter på ett ställe'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          <p className="reveal reveal-5 mt-8 border-t border-white/10 pt-6 text-sm text-slate-400">
            Frilansare?{' '}
            <Link href="/register" className="font-semibold text-indigo-300 underline-offset-4 transition hover:text-indigo-200 hover:underline">
              Skapa en profil och hitta nya kunder
            </Link>
          </p>
        </div>

        <div className="reveal reveal-2 relative hidden lg:block">
          <HeroIllustration className="h-auto w-full max-w-xl" />
        </div>
      </div>

      {/* Kategoriremsa: visar bredden på plattformen utan att påstå volym. */}
      <div className="relative border-t border-white/10 bg-white/[0.03] py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
          {['Webbutveckling', 'Design', 'Marknadsföring', 'Ekonomi', 'Juridik', 'IT & support'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
