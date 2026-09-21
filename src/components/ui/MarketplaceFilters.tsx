'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { CATEGORIES } from '@/lib/categories'
export default function MarketplaceFilters({ services = false }: { services?: boolean }) {
  const pathname = usePathname()
  const params = useSearchParams()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  return <form key={params.toString()} className="mb-6 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={event => {
    event.preventDefault()
    const next = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => { if (String(value).trim()) next.set(key, String(value).trim()) })
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }))
  }}>
    <label className="space-y-1 text-sm font-medium">Sök {services ? 'tjänster' : 'uppdrag'}<input name="q" type="search" maxLength={120} defaultValue={params.get('q') ?? ''} className={field} /></label>
    <label className="space-y-1 text-sm font-medium">Kategori<select name="category" defaultValue={params.get('category') ?? ''} className={field}><option value="">Alla kategorier</option>{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
    {services ? <label className="space-y-1 text-sm font-medium">Maxpris (kr)<input name="max_price" type="number" min="0" max="99999999" defaultValue={params.get('max_price') ?? ''} className={field} /></label> : <label className="space-y-1 text-sm font-medium">Arbetsform<select name="worktype" defaultValue={params.get('worktype') ?? ''} className={field}><option value="">Alla arbetsformer</option><option value="remote">På distans</option><option value="onsite">På plats</option><option value="hybrid">Hybrid</option></select></label>}
    <label className="space-y-1 text-sm font-medium">Sortering<select name="sort" defaultValue={params.get('sort') ?? 'newest'} className={field}><option value="newest">Nyast först</option><option value="oldest">Äldst först</option>{services && <><option value="price_asc">Pris: lägst först</option><option value="price_desc">Pris: högst först</option></>}</select></label>
    <div className="flex items-center gap-3"><button disabled={pending} className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white" type="submit">{pending ? 'Söker…' : 'Sök'}</button><button type="button" className="text-sm underline" onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}>Rensa</button></div>
    <span role="status" className="sr-only">{pending ? 'Söker…' : ''}</span>
  </form>
}
