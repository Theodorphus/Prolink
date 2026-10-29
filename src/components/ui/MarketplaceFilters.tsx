'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { localizedCategories } from '@/lib/categories'
import { useT } from '@/i18n/client'
export default function MarketplaceFilters({ services = false }: { services?: boolean }) {
  const t = useT()
  const pathname = usePathname()
  const params = useSearchParams()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  const activeFilters = ['category', 'max_price', 'worktype', 'verified'].filter(key => params.get(key)).length
    + (params.get('sort') && params.get('sort') !== 'newest' ? 1 : 0)
  // På mobil tog fyra staplade fält nära 400 pixlar innan första träffen.
  // Bara sökfältet visas då direkt; resten fälls ut, och är redan utfällt
  // om något filter är aktivt så att det syns vad listan är filtrerad på.
  // Formuläret monteras om vid varje URL-byte (key), så läget följer URL:en.
  const [expanded, setExpanded] = useState(activeFilters > 0)
  return <form key={params.toString()} className={`mb-6 grid items-end gap-3 sm:grid-cols-2 ${services ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`} onSubmit={event => {
    event.preventDefault()
    const next = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => { if (String(value).trim()) next.set(key, String(value).trim()) })
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }))
  }}>
    <label className="space-y-1 text-sm font-medium">{services ? t('Sök tjänster') : t('Sök uppdrag')}<input name="q" type="search" maxLength={120} defaultValue={params.get('q') ?? ''} className={field} /></label>
    <div id="fler-filter" className={`${expanded ? 'grid' : 'hidden'} gap-3 sm:contents`}>
      <label className="space-y-1 text-sm font-medium">{t('Kategori')}<select name="category" defaultValue={params.get('category') ?? ''} className={field}><option value="">{t('Alla kategorier')}</option>{localizedCategories(t).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
      {services ? <label className="space-y-1 text-sm font-medium">{t('Maxpris (kr)')}<input name="max_price" type="number" inputMode="numeric" min="0" max="99999999" defaultValue={params.get('max_price') ?? ''} className={field} /></label> : <label className="space-y-1 text-sm font-medium">{t('Arbetsform')}<select name="worktype" defaultValue={params.get('worktype') ?? ''} className={field}><option value="">{t('Alla arbetsformer')}</option><option value="remote">{t('På distans')}</option><option value="onsite">{t('På plats')}</option><option value="hybrid">{t('Hybrid')}</option></select></label>}
      <label className="space-y-1 text-sm font-medium">{t('Sortering')}<select name="sort" defaultValue={params.get('sort') ?? 'newest'} className={field}><option value="newest">{t('Nyast först')}</option><option value="oldest">{t('Äldst först')}</option>{services && <><option value="price_asc">{t('Pris: lägst först')}</option><option value="price_desc">{t('Pris: högst först')}</option><option value="references">{t('Flest referenser')}</option></>}</select></label>
      {services && <label className="flex items-center gap-2 pb-2.5 text-sm font-medium"><input name="verified" type="checkbox" value="1" defaultChecked={params.get('verified') === '1'} className="h-4 w-4 rounded border-slate-300" />{t('Endast verifierade företag')}</label>}
    </div>
    <div className="flex items-center gap-2">
      <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 sm:hidden" aria-expanded={expanded} aria-controls="fler-filter" onClick={() => setExpanded(value => !value)}>
        {t('Filter')}{activeFilters > 0 ? ` (${activeFilters})` : ''}
      </button>
      <button disabled={pending} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white" type="submit">{pending ? t('Söker…') : t('Sök')}</button>
      <button type="button" className="rounded-xl px-3 py-2.5 text-sm underline" onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}>{t('Rensa')}</button>
    </div>
    <span role="status" className="sr-only">{pending ? t('Söker…') : ''}</span>
  </form>
}
