'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export default function ServiceFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const q = searchParams.get('q') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'
  const maxPrice = searchParams.get('max_price') ?? ''

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="search"
          defaultValue={q}
          placeholder="Sök tjänster..."
          onChange={e => update('q', e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <select
        value={sort}
        onChange={e => update('sort', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="newest">Nyast först</option>
        <option value="oldest">Äldst först</option>
        <option value="price_asc">Pris: låg→hög</option>
        <option value="price_desc">Pris: hög→låg</option>
      </select>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Max</span>
        <input
          type="number"
          defaultValue={maxPrice}
          placeholder="Pris"
          min="0"
          onChange={e => update('max_price', e.target.value)}
          className="pl-10 pr-10 py-2 w-36 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">kr</span>
      </div>
    </div>
  )
}
