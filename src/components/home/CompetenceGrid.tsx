import Link from 'next/link'
import { CATEGORIES, PRIORITY_CATEGORIES } from '@/lib/categories'

/** Kort förklaring per kategori. Beskriver vad man kan köpa, inte vem som finns. */
const BLURBS: Record<string, string> = {
  webbutveckling: 'Webbplatser, e-handel, integrationer och löpande förvaltning.',
  design: 'Logotyp, grafisk profil, UI-design och material för tryck och webb.',
  marknadsforing: 'SEO, annonsering, sociala medier och nyhetsbrev.',
  redovisning: 'Löpande bokföring, bokslut, deklaration och ekonomisk rådgivning.',
  juridik: 'Avtalsgranskning, GDPR, bolagsrätt och villkor för webben.',
  text: 'Copy, artiklar, produkttexter och översättning till och från svenska.',
  'foto-video': 'Produktbilder, företagsporträtt, filmproduktion och redigering.',
  'it-support': 'Drift, säkerhet, molntjänster och teknisk support på distans.',
  affarsstod: 'Administration, projektledning, research och virtuell assistans.',
}

export default function CompetenceGrid() {
  // "Annat" hör inte hemma i en presentationsyta; de nio övriga bildar rutnätet.
  const categories = CATEGORIES.filter(category => category.value !== 'annat')
  const priority = new Set<string>(PRIORITY_CATEGORIES as readonly string[])

  return (
    <section className="border-b border-slate-200/70 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="page-eyebrow">Kompetensområden</p>
            <h2 className="page-heading mt-3 text-[2rem] sm:text-4xl">Vad behöver ni hjälp med?</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Specialisttjänster som levereras på distans, över hela Sverige.
            </p>
          </div>
          <Link
            href="/services"
            className="shrink-0 text-sm font-bold text-slate-600 transition hover:text-indigo-600"
          >
            Se alla tjänster →
          </Link>
        </div>

        {/* 3×3 på desktop. På mobil visas de fyra prioriterade direkt och
            resten bakom en disclosure, så att sidan inte blir onödigt lång. */}
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.map(category => (
            <Link
              key={category.value}
              href={`/services?category=${category.value}`}
              className={`gradient-border surface surface-interactive group flex flex-col p-6 ${
                priority.has(category.value) ? '' : 'hidden sm:flex'
              }`}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'var(--accent-tint)', color: 'var(--accent-deep)' }}
                aria-hidden
              >
                {category.emoji}
              </span>
              <h3 className="mt-5 font-bold leading-snug tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-indigo-600">
                {category.label}
              </h3>
              <p className="mt-2 flex-1 text-[13px] leading-6 text-slate-500">
                {BLURBS[category.value] ?? ''}
              </p>
              <p className="mt-4 text-xs font-bold text-indigo-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Hitta specialist →
              </p>
            </Link>
          ))}
        </div>

        <details className="group mt-4 sm:hidden">
          <summary className="flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm marker:content-none">
            <span className="group-open:hidden">Visa alla kategorier</span>
            <span className="hidden group-open:inline">Visa färre</span>
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {categories
              .filter(category => !priority.has(category.value))
              .map(category => (
                <Link
                  key={category.value}
                  href={`/services?category=${category.value}`}
                  className="surface flex flex-col p-6"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{ background: 'var(--accent-tint)', color: 'var(--accent-deep)' }}
                    aria-hidden
                  >
                    {category.emoji}
                  </span>
                  <h3 className="mt-5 font-bold leading-snug tracking-[-0.02em] text-slate-900">
                    {category.label}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-500">
                    {BLURBS[category.value] ?? ''}
                  </p>
                </Link>
              ))}
          </div>
        </details>
      </div>
    </section>
  )
}
