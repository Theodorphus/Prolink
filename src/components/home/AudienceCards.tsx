import Link from '@/components/i18n/Link'
import { getT } from '@/i18n/server'
import type { TFunction } from '@/i18n/translate'

// Illustrationerna får bara plats bredvid texten när korten är tillräckligt
// breda: staplade på surfplatta och nedåt från xl sida vid sida. På mobil och
// i det smala tvåkolumnsläget däremellan visas bara texten.
const ILLUSTRATION = 'pointer-events-none absolute right-5 top-1/2 hidden w-56 -translate-y-1/2 sm:block lg:hidden xl:block'
const TEXT_COLUMN = 'relative sm:max-w-[55%] lg:max-w-none xl:max-w-[55%]'

function Arrow() {
  return (
    <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
      →
    </span>
  )
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

/** Staplarna står för namn och text, så att bilden inte ser ut som en riktig kund. */
function OfferRow({ price, selected }: { price: string; selected?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 ${
      selected ? 'bg-white shadow-xl shadow-black/30' : 'border border-white/10 bg-white/[0.07]'
    }`}>
      <span className={`h-8 w-8 shrink-0 rounded-full ${selected ? 'bg-blue-100' : 'bg-white/15'}`} />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className={`block h-2 w-16 rounded-full ${selected ? 'bg-slate-300' : 'bg-white/25'}`} />
        <span className={`block h-1.5 w-10 rounded-full ${selected ? 'bg-slate-200' : 'bg-white/15'}`} />
      </span>
      <span className={`text-xs font-bold ${selected ? 'text-slate-900' : 'text-white/70'}`}>{price}</span>
      {selected && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
          <CheckIcon className="h-3 w-3" />
        </span>
      )}
    </div>
  )
}

function OffersIllustration({ t }: { t: TFunction }) {
  return (
    <div className={`${ILLUSTRATION} rotate-2`} aria-hidden>
      <p className="mb-3 text-xs font-bold text-white/70">{t('Offerter')}</p>
      <div className="space-y-2.5">
        <OfferRow price="9 500 kr" />
        <div className="-mx-2"><OfferRow price="7 800 kr" selected /></div>
        <OfferRow price="12 000 kr" />
      </div>
    </div>
  )
}

function InquiryIllustration({ t }: { t: TFunction }) {
  return (
    <div className={`${ILLUSTRATION} -rotate-2`} aria-hidden>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-blue-900/10">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 shrink-0 rounded-full bg-blue-100" />
          <span className="min-w-0 flex-1 space-y-1.5">
            <span className="block h-2 w-20 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1 text-[11px] font-bold text-teal-700">
              <CheckIcon className="h-3 w-3" />
              {t('Verifierat företag')}
            </span>
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <span className="block h-1.5 w-full rounded-full bg-slate-100" />
          <span className="block h-1.5 w-4/5 rounded-full bg-slate-100" />
          <span className="block h-1.5 w-3/5 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="relative -mt-3 ml-6 -mr-3 flex items-center gap-2.5 rounded-xl p-3 text-white shadow-xl shadow-blue-700/30" style={{ background: 'var(--accent)' }}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-teal-300" />
        <span className="text-xs font-bold">{t('Ny förfrågan till dig')}</span>
      </div>
    </div>
  )
}

/** Avslutande CTA: en yta per målgrupp. Köparkortet väger tyngst. */
export default async function AudienceCards() {
  const t = await getT()
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
        <div
          className="relative overflow-hidden rounded-3xl p-9 text-white sm:p-12"
          style={{ background: 'var(--gradient-ink)' }}
        >
          <div
            className="mesh mesh-drift"
            style={{ width: '18rem', height: '18rem', right: '-4rem', top: '-4rem', background: 'rgba(37, 99, 235,.4)' }}
          />
          <OffersIllustration t={t} />
          <div className={TEXT_COLUMN}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              {t('För dig som köper tjänster')}
            </p>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] [text-wrap:balance]">
              {t('Rätt hjälp utan ett stort nätverk.')}
            </h2>
            <p className="mt-4 leading-7 text-slate-300">
              {t('Publicera ert behov en gång, jämför konkreta offerter och välj den kompetens som passar företaget.')}
            </p>
            <Link
              href="/jobs/create"
              className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              {t('Publicera uppdrag')}
              <Arrow />
            </Link>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-slate-200 p-9 sm:p-12"
          style={{ background: 'linear-gradient(140deg, #ffffff 35%, #eff6ff 100%)' }}
        >
          <InquiryIllustration t={t} />
          <div className={TEXT_COLUMN}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              {t('För dig som säljer tjänster')}
            </p>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] [text-wrap:balance] text-slate-900">
              {t('Låt nästa kund hitta dig.')}
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              {t('Visa vad du erbjuder, hitta relevanta uppdrag och bygg förtroende genom lyckade leveranser.')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/services/create"
                className="group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-accent)' }}
              >
                {t('Publicera en tjänst')}
                <Arrow />
              </Link>
              <Link
                href="/jobs"
                className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 transition hover:text-blue-700"
              >
                {t('Se uppdrag')}
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
