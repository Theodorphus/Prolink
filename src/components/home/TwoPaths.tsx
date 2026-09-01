import Link from 'next/link'

const PATHS = [
  {
    eyebrow: 'Väg A',
    title: 'Publicera ett uppdrag',
    body: 'Har ni ett specifikt behov? Beskriv det en gång och låt frilansare komma till er med förslag på upplägg, pris och tidplan. Ni jämför och väljer själva.',
    meta: 'Passar när behovet behöver anpassas',
    cta: 'Beskriv ert uppdrag',
    href: '/jobs/create',
    primary: true,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    ),
  },
  {
    eyebrow: 'Väg B',
    title: 'Utforska färdiga tjänster',
    body: 'Vet ni redan vad ni vill ha? Bläddra bland tjänster där frilansaren angett pris och leveranstid i förväg. Ni ser omfattningen direkt och tar kontakt.',
    meta: 'Passar när omfattningen är tydlig',
    cta: 'Se tjänster',
    href: '/services',
    primary: false,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    ),
  },
]

export default function TwoPaths() {
  return (
    <section className="border-b border-slate-200/70 px-4 py-20 sm:px-6 sm:py-24 lg:px-8" style={{ background: 'var(--gradient-soft)' }}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="page-eyebrow">Två vägar</p>
          <h2 className="page-heading mt-3 text-[2rem] sm:text-4xl">Välj det som passar ert behov</h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PATHS.map((path, index) => (
            <article
              key={path.title}
              className={`reveal reveal-${index + 1} gradient-border surface surface-interactive flex flex-col p-8 sm:p-10`}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={
                  path.primary
                    ? { background: 'var(--accent-tint)', color: 'var(--accent-deep)' }
                    : { background: 'var(--teal-tint)', color: 'var(--teal-deep)' }
                }
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" aria-hidden>
                  {path.icon}
                </svg>
              </span>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{path.eyebrow}</p>
              <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-900">{path.title}</h3>
              <p className="mt-3.5 flex-1 text-[15px] leading-7 text-slate-600">{path.body}</p>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">{path.meta}</p>

              <Link
                href={path.href}
                className={
                  path.primary
                    ? 'mt-7 inline-flex self-start rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5'
                    : 'mt-7 inline-flex self-start rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                }
                style={path.primary ? { background: 'var(--accent)', boxShadow: 'var(--shadow-accent)' } : undefined}
              >
                {path.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="muted mt-7 max-w-3xl text-sm leading-6">
          Oavsett väg sker dialog, leverans och omdöme i Prolink. Betalningen kommer ni överens om
          direkt med varandra.
        </p>
      </div>
    </section>
  )
}
