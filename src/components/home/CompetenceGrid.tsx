import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import Link from '@/components/i18n/Link'
import { CATEGORIES, getCategoryImage } from '@/lib/categories'
import { createPublicClient } from '@/lib/supabase/public'
import { getT } from '@/i18n/server'
import { msg } from '@/i18n/msg.mjs'
import type { TFunction } from '@/i18n/translate'

// "Annat" hör inte hemma i en presentationsyta; de nio övriga bildar rutnätet.
const GRID_CATEGORIES = CATEGORIES.filter(category => category.value !== 'annat')
// Så många kategorier visas direkt på mobil, resten ligger bakom en disclosure.
const MOBILE_VISIBLE = 4

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

// Samma urval som tjänstelistorna: bara tjänster från aktiva leverantörer.
// Ett head-anrop per kategori räknar i databasen och påverkas därför inte av
// radgränsen, och cachen gör att det sker högst en gång i minuten.
const categoryCounts = unstable_cache(async () => {
  const supabase = createPublicClient()
  const results = await Promise.all(GRID_CATEGORIES.map(category =>
    supabase
      .from('services')
      .select('id, provider:users!inner(role)', { count: 'exact', head: true })
      .eq('provider.role', 'provider')
      .eq('category', category.value)
  ))
  if (results.some(result => result.error)) throw new Error('Category counts unavailable')
  return Object.fromEntries(GRID_CATEGORIES.map((category, index) => [category.value, results[index].count ?? 0]))
}, ['public-category-counts'], { revalidate: 60 })

function serviceCountLabel(count: number, t: TFunction) {
  if (count === 0) return t('Inga tjänster ännu')
  return count === 1 ? t('1 tjänst') : t('{count} tjänster', { count })
}

function CategoryCard({ category, count, t, className = 'flex' }: {
  category: typeof GRID_CATEGORIES[number]
  count?: number
  t: TFunction
  className?: string
}) {
  return (
    <Link
      href={`/hitta/${category.value}`}
      className={`gradient-border surface surface-interactive group overflow-hidden ${className}`}
    >
      <div className="relative w-24 shrink-0 overflow-hidden bg-slate-100 sm:w-28">
        <Image
          src={getCategoryImage(category.value)}
          alt=""
          fill
          sizes="(min-width: 640px) 112px, 96px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="font-bold leading-snug tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
          {t(category.label)}
        </h3>
        <p className="mt-1 flex-1 text-[13px] leading-5 text-slate-500">
          {t(BLURBS[category.value] ?? '')}
        </p>
        {/* Raden behåller sin höjd medan siffrorna laddas, så att korten inte hoppar. */}
        <p className={`mt-2 min-h-5 text-xs font-bold leading-5 ${count ? 'text-blue-700' : 'text-slate-500'}`}>
          {count === undefined ? null : serviceCountLabel(count, t)}
        </p>
      </div>
    </Link>
  )
}

export default async function CompetenceGrid({ pending }: { pending?: boolean }) {
  const t = await getT()
  // Går siffrorna inte att hämta visas rutnätet ändå, utan antal och i grundordning.
  const counts = pending ? null : await categoryCounts().catch(() => null)
  // Flest tjänster först. Sorteringen är stabil, så lika många behåller grundordningen.
  const categories = counts
    ? [...GRID_CATEGORIES].sort((a, b) => counts[b.value] - counts[a.value])
    : GRID_CATEGORIES

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
            className="shrink-0 text-sm font-bold text-slate-600 transition hover:text-blue-700"
          >
            {t('Se alla tjänster →')}
          </Link>
        </div>

        {/* 3×3 på desktop. På mobil visas de största kategorierna direkt och
            resten bakom en disclosure, så att sidan inte blir onödigt lång. */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.value}
              category={category}
              count={counts?.[category.value]}
              t={t}
              className={index < MOBILE_VISIBLE ? 'flex' : 'hidden sm:flex'}
            />
          ))}
        </div>

        <details className="group mt-3 sm:hidden">
          <summary className="flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm marker:content-none">
            <span className="group-open:hidden">{t('Visa alla kategorier')}</span>
            <span className="hidden group-open:inline">{t('Visa färre')}</span>
          </summary>
          <div className="mt-3 grid gap-3">
            {categories.slice(MOBILE_VISIBLE).map(category => (
              <CategoryCard key={category.value} category={category} count={counts?.[category.value]} t={t} />
            ))}
          </div>
        </details>
      </div>
    </section>
  )
}
