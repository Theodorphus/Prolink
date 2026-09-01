import Link from 'next/link'

/**
 * Förtroendeavsnitt.
 *
 * Designbriefen bad om kundlogotyper, testimonials och siffror i stil med
 * "+1200 frilansare". Plattformen har i skrivande stund ett fåtal användare och
 * inga omdömen. Påhittade logotyper och citat vore uppdiktade referenser, och en
 * besökare kan motbevisa dem med ett klick på uppdragslistan. Det skadar exakt
 * det förtroende avsnittet ska bygga.
 *
 * I stället: verkliga siffror från databasen, en ärlig ram om att plattformen är
 * ny, och de garantier som faktiskt gäller. När det finns riktiga omdömen kan de
 * lyftas in här.
 */
export default function TrustSection({
  providerCount,
  openJobCount,
  serviceCount,
}: {
  providerCount: number
  openJobCount: number
  serviceCount: number
}) {
  const stats = [
    { value: providerCount, label: providerCount === 1 ? 'frilansare' : 'frilansare', suffix: '' },
    { value: openJobCount, label: openJobCount === 1 ? 'öppet uppdrag' : 'öppna uppdrag', suffix: '' },
    { value: serviceCount, label: serviceCount === 1 ? 'publicerad tjänst' : 'publicerade tjänster', suffix: '' },
  ]

  const guarantees = [
    {
      title: 'Kostnadsfritt att komma igång',
      body: 'Publicera uppdrag och skapa profil utan avgift. Inga bindningstider och ingen provision på det ni kommer överens om.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      title: 'Omdömen först efter genomfört uppdrag',
      body: 'Bara parter i ett slutfört uppdrag kan lämna omdöme. Regeln är låst i databasen, inte bara i gränssnittet.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      title: 'Ni äger dialogen',
      body: 'Ingen mellanhand som styr kontakten. Uppdrag, offerter och chatt samlas på ett ställe, men villkoren är era.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      ),
    },
    {
      title: 'Privata uppgifter stannar privata',
      body: 'Telefonnummer och CV ligger bakom separata behörigheter och lämnar aldrig servern i ett publikt svar.',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      ),
    },
  ]

  return (
    <section className="border-b border-slate-200/70 px-4 py-20 sm:px-6 sm:py-24 lg:px-8" style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="page-eyebrow">Öppet läge</p>
          <h2 className="page-heading mt-3 text-[2rem] sm:text-4xl">
            Ny plattform, tydliga spelregler
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Prolink är i ett tidigt skede. Vi visar hellre de faktiska siffrorna än lånar
            trovärdighet vi inte byggt än.
          </p>
        </div>

        {/* Verkliga siffror, hämtade live. Inga påhittade volymer. */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={stat.label} className={`reveal reveal-${index + 1} surface p-8 text-center`}>
              <p
                className="text-5xl font-extrabold tracking-[-0.04em]"
                style={{ color: 'var(--accent-deep)' }}
              >
                {stat.value}
              </p>
              <p className="muted mt-2 text-sm font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="muted mt-5 text-center text-sm">
          Siffrorna uppdateras direkt från plattformen.{' '}
          <Link href="/jobs" className="font-semibold text-indigo-600 underline-offset-4 hover:underline">
            Se uppdragen själv
          </Link>
          .
        </p>

        {/* Garantier i stället för testimonials: påståenden vi kan stå för. */}
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {guarantees.map((item, index) => (
            <div key={item.title} className={`reveal reveal-${index + 1} surface flex gap-4 p-7`}>
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--teal-tint)', color: 'var(--teal-deep)' }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
                  {item.icon}
                </svg>
              </span>
              <div>
                <h3 className="font-bold tracking-[-0.02em] text-slate-900">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-slate-600">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
