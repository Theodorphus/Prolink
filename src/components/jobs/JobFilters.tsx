'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { CATEGORIES } from '@/lib/categories'

export default function JobFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const q = searchParams.get('q') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'
  const category = searchParams.get('category') ?? ''
  const worktype = searchParams.get('worktype') ?? ''

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="search"
          defaultValue={q}
          placeholder="Sök uppdrag..."
          onChange={e => update('q', e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <select
        value={category}
        onChange={e => update('category', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Alla kategorier</option>
        {CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
        ))}
      </select>

      <select
        value={worktype}
        onChange={e => update('worktype', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Alla arbetsformer</option>
        <option value="remote">På distans</option>
        <option value="onsite">På plats</option>
        <option value="hybrid">Hybrid</option>
      </select>

      <select
        value={sort}
        onChange={e => update('sort', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="newest">Nyast först</option>
        <option value="oldest">Äldst först</option>
      </select>
    </div>
  )
}
