import Pagination from '@/components/ui/Pagination'
import { pageNumber, PAGE_SIZE } from '@/lib/pagination'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient, getUser } from '@/lib/supabase/server'
import ServiceFilters from '@/components/services/ServiceFilters'
import ServiceCard from '@/components/services/ServiceCard'
import { searchTerm } from '@/lib/validation'

export const metadata = {
  alternates: { canonical: '/services' },
  title: 'Tjänster – Hitta freelancers',
  description: 'Hitta kvalificerade freelancers och byråer. Jämför priser, leveranstider och kompetenser och skicka en förfrågan.',
}

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; max_price?: string; category?: string }>
}

export default async function ServicesPage(props: Props) {
  const searchParams = await props.searchParams;
  const page = pageNumber(searchParams.page)
  const supabase = await createClient()
  const { q, sort = 'newest', max_price, category } = searchParams

  const { data: { user } } = await getUser()
  const { data: profile } = user
    ? await supabase.from('users').select('role').eq('id', user.id).single()
    : { data: null }
  const isProvider = profile?.role === 'provider'

  let query = supabase
    .from('services')
    .select('*, provider:users(id, name, avatar_url)', { count: 'exact' })

  if (q) {
    const safeQuery = searchTerm(q)
    if (safeQuery) query = query.or(`title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`)
  }

  // Number('abc') ger NaN, och price=lte.NaN filtrerar inte alls utan
  // returnerar hela tabellen. Ett ogiltigt värde ska ignoreras i stället.
  const maxPrice = Number(max_price)
  if (max_price && Number.isFinite(maxPrice) && maxPrice >= 0) {
    query = query.lte('price', maxPrice)
  }

  if (category) {
    query = query.eq('category', category)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: services, count, error } = await query.order('id', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw new Error('Listan kunde inte hämtas. Försök igen.')

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="page-eyebrow">Tjänster</p>
          <h1 className="page-heading mt-2.5 text-3xl sm:text-4xl">Färdiga tjänster</h1>
          <p className="muted mt-2 text-sm font-medium">
            {count ?? 0} {services?.length === 1 ? 'tjänst' : 'tjänster'} med frånpris och angiven leveranstid
          </p>
        </div>
        {isProvider && (
          <Link
            href="/services/create"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/25"
          >
            Ny tjänst
          </Link>
        )}
      </div>

      <Suspense>
        <ServiceFilters />
      </Suspense>

      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => (
          <ServiceCard key={service.id} service={{ ...service, provider: Array.isArray(service.provider) ? service.provider[0] : service.provider }} />
        ))}

        {(!services || services.length === 0) && (
          <div className="col-span-full text-center py-16 text-gray-500">
            {q ? (
              <p className="text-lg">Inga tjänster matchade &ldquo;{q}&rdquo;.</p>
            ) : (
              <>
                <p className="text-lg">Inga tjänster ännu.</p>
                {isProvider && (
                  <Link
                    href="/services/create"
                    className="mt-4 inline-flex items-center bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Lägg till den första tjänsten
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} pathname="/services" params={searchParams} />
    </div>
  )
}
