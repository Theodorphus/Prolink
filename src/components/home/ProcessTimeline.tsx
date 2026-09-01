const STEPS = [
  {
    title: 'Beskriv uppdraget',
    body: 'Berätta vad ni behöver, önskad budget och när det ska vara klart. Tar några minuter.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 14.25v4.75A2 2 0 0117.5 21h-11a2 2 0 01-2-2v-11a2 2 0 012-2h4.75" />
    ),
  },
  {
    title: 'Jämför offerter',
    body: 'Frilansare svarar med pris, upplägg och tidplan. Du ser deras profiler och tidigare omdömen.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    ),
  },
  {
    title: 'Samarbeta och slutför',
    body: 'Ni för dialogen i Prolink, frilansaren levererar, ni godkänner och lämnar omdömen.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
]

export default function ProcessTimeline() {
  return (
    <section className="border-b border-slate-200/70 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="page-eyebrow">Så funkar det</p>
          <h2 className="page-heading mt-3 text-[2rem] sm:text-4xl">Från behov till levererat</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Tre steg. Ingen upphandling, inga mellanhänder och inget krångel.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* Tidslinjen ritas bakom stegen och bara på desktop, där de tre
              korten faktiskt ligger på rad. */}
          <div
            className="absolute left-0 right-0 top-7 hidden h-px md:block"
            style={{ background: 'linear-gradient(90deg, transparent, var(--line-strong) 12%, var(--line-strong) 88%, transparent)' }}
            aria-hidden
          />

          {STEPS.map((step, index) => (
            <li key={step.title} className={`reveal reveal-${index + 1} relative`}>
              <div className="flex items-center gap-4 md:block">
                <span
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-accent)' }}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                    {step.icon}
                  </svg>
                </span>

                <p className="text-sm font-black tracking-wider text-indigo-600 md:mt-6">
                  STEG {index + 1}
                </p>
              </div>

              <h3 className="mt-3 text-xl font-bold tracking-[-0.025em] text-slate-900 md:mt-2">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-7 text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
