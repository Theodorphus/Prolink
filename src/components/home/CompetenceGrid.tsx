import Image from 'next/image'
import Link from '@/components/i18n/Link'
import { CATEGORIES, PRIORITY_CATEGORIES, getCategoryImage } from '@/lib/categories'
import { getT } from '@/i18n/server'
import { msg } from '@/i18n/msg.mjs'

/** Kort förklaring per kategori. Beskriver vad man kan köpa, inte vem som finns. */
const BLURBS: Record<string, string> = {
  webbutveckling: msg('Webbplatser, e-handel, integrationer och löpande förvaltning.'),
  design: msg('Logotyp, grafisk profil, UI-design och material för tryck och webb.'),
  marknadsforing: msg('SEO, annonsering, sociala medier och nyhetsbrev.'),
  redovisning: msg('Löpande bokföring, bokslut, deklaration och ekonomisk rådgivning.'),
  juridik: msg('Avtalsgranskning, GDPR, bolagsrätt och villkor för webben.'),
  text: msg('Copy, artiklar, produkttexter och översättning till och från svenska.'),
  'foto-video': msg('Produktbilder, företagsporträtt, filmproduktion och redigering.'),
  'it-support': msg('Drift, säkerhet, molntjänster och teknisk support på distans.'),
  affarsstod: msg('Administration, projektledning, research och virtuell assistans.'),
}

function CategoryImage({ category, interactive }: { category: string; interactive?: boolean }) {
  return (
    <div className="aspect-[3/2] overflow-hidden bg-slate-100">
      <Image
        src={getCategoryImage(category)}
        alt=""
        width={1200}
        height={800}
        sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, 50vw"
        className={`h-full w-full object-cover ${interactive ? 'transition-transform duration-500 group-hover:scale-105' : ''}`}
      />
    </div>
  )
}

export default async function CompetenceGrid() {
  const t = await getT()
  // "Annat" hör inte hemma i en presentationsyta; de nio övriga bildar rutnätet.
  const categories = CATEGORIES.filter(category => category.value !== 'annat')
  const priority = new Set<string>(PRIORITY_CATEGORIES as readonly string[])

  return (
    <section className="border-b border-slate-200/70 bg-white px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="page-eyebrow">{t('Kompetensområden')}</p>
            <h2 className="page-heading mt-3 text-[2rem] sm:text-4xl">{t('Vad behöver ni hjälp med?')}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {t('Specialisttjänster som levereras på distans, över hela Sverige.')}
            </p>
          </div>
          <Link
            href="/services"
            className="shrink-0 text-sm font-bold text-slate-600 transition hover:text-indigo-600"
          >
            {t('Se alla tjänster →')}
          </Link>
        </div>

        {/* 3×3 på desktop. På mobil visas de fyra prioriterade direkt och
            resten bakom en disclosure, så att sidan inte blir onödigt lång. */}
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.map(category => (
            <Link
              key={category.value}
              href={`/hitta/${category.value}`}
              className={`gradient-border surface surface-interactive group flex flex-col overflow-hidden ${
                priority.has(category.value) ? '' : 'hidden sm:flex'
              }`}
            >
              <CategoryImage category={category.value} interactive />
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="font-bold leading-snug tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-indigo-600">
                  {t(category.label)}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-6 text-slate-500">
                  {t(BLURBS[category.value] ?? '')}
                </p>
                <p className="mt-4 text-xs font-bold text-indigo-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {t('Hitta specialist →')}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <details className="group mt-4 sm:hidden">
          <summary className="flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm marker:content-none">
            <span className="group-open:hidden">{t('Visa alla kategorier')}</span>
            <span className="hidden group-open:inline">{t('Visa färre')}</span>
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {categories
              .filter(category => !priority.has(category.value))
              .map(category => (
                <Link
                  key={category.value}
                  href={`/hitta/${category.value}`}
                  className="surface flex flex-col overflow-hidden"
                >
                  <CategoryImage category={category.value} />
                  <div className="p-5">
                    <h3 className="font-bold leading-snug tracking-[-0.02em] text-slate-900">
                      {t(category.label)}
                    </h3>
                    <p className="mt-2 text-[13px] leading-6 text-slate-500">
                      {t(BLURBS[category.value] ?? '')}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </details>
      </div>
    </section>
  )
}
