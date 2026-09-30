'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CATEGORIES } from '@/lib/categories'
export default function MarketplaceFilters({ services = false }: { services?: boolean }) {
  const pathname = usePathname()
  const params = useSearchParams()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  const activeFilters = ['category', 'max_price', 'worktype'].filter(key => params.get(key)).length
    + (params.get('sort') && params.get('sort') !== 'newest' ? 1 : 0)
  // På mobil tog fyra staplade fält nära 400 pixlar innan första träffen.
  // Bara sökfältet visas då direkt; resten fälls ut, och är redan utfällt
  // om något filter är aktivt så att det syns vad listan är filtrerad på.
  // Formuläret monteras om vid varje URL-byte (key), så läget följer URL:en.
  const [expanded, setExpanded] = useState(activeFilters > 0)
  return <form key={params.toString()} className="mb-6 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={event => {
    event.preventDefault()
    const next = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => { if (String(value).trim()) next.set(key, String(value).trim()) })
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }))
  }}>
    <label className="space-y-1 text-sm font-medium">Sök {services ? 'tjänster' : 'uppdrag'}<input name="q" type="search" maxLength={120} defaultValue={params.get('q') ?? ''} className={field} /></label>
    <div id="fler-filter" className={`${expanded ? 'grid' : 'hidden'} gap-3 sm:contents`}>
      <label className="space-y-1 text-sm font-medium">Kategori<select name="category" defaultValue={params.get('category') ?? ''} className={field}><option value="">Alla kategorier</option>{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
      {services ? <label className="space-y-1 text-sm font-medium">Maxpris (kr)<input name="max_price" type="number" inputMode="numeric" min="0" max="99999999" defaultValue={params.get('max_price') ?? ''} className={field} /></label> : <label className="space-y-1 text-sm font-medium">Arbetsform<select name="worktype" defaultValue={params.get('worktype') ?? ''} className={field}><option value="">Alla arbetsformer</option><option value="remote">På distans</option><option value="onsite">På plats</option><option value="hybrid">Hybrid</option></select></label>}
      <label className="space-y-1 text-sm font-medium">Sortering<select name="sort" defaultValue={params.get('sort') ?? 'newest'} className={field}><option value="newest">Nyast först</option><option value="oldest">Äldst först</option>{services && <><option value="price_asc">Pris: lägst först</option><option value="price_desc">Pris: högst först</option></>}</select></label>
    </div>
    <div className="flex items-center gap-2">
      <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 sm:hidden" aria-expanded={expanded} aria-controls="fler-filter" onClick={() => setExpanded(value => !value)}>
        Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
      </button>
      <button disabled={pending} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white" type="submit">{pending ? 'Söker…' : 'Sök'}</button>
      <button type="button" className="rounded-xl px-3 py-2.5 text-sm underline" onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}>Rensa</button>
    </div>
    <span role="status" className="sr-only">{pending ? 'Söker…' : ''}</span>
  </form>
}
