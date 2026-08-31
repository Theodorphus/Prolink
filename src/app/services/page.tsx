import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ServiceFilters from '@/components/services/ServiceFilters'
import ServiceCard from '@/components/services/ServiceCard'

export const metadata = {
  title: 'Tjänster – Hitta freelancers',
  description: 'Hitta kvalificerade freelancers och byråer. Jämför priser, leveranstider och kompetenser – boka direkt.',
}

interface Props {
  searchParams: Promise<{ q?: string; sort?: string; max_price?: string; category?: string }>
}

export default async function ServicesPage(props: Props) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { q, sort = 'newest', max_price, category } = searchParams

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('users').select('role').eq('id', user.id).single()
    : { data: null }
  const isProvider = profile?.role === 'provider'

  let query = supabase
    .from('services')
    .select('*, provider:users(id, name, avatar_url)')

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  if (max_price) {
    query = query.lte('price', Number(max_price))
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

  const { data: services } = await query

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="page-eyebrow">Tjänster</p>
          <h1 className="page-heading mt-2.5 text-3xl sm:text-4xl">Färdiga tjänster</h1>
          <p className="muted mt-2 text-sm font-medium">
            {services?.length ?? 0} {services?.length === 1 ? 'tjänst' : 'tjänster'} med fast pris och leveranstid
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
        {services?.map((service: any) => (
          <ServiceCard key={service.id} service={service} />
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
    </div>
  )
}
