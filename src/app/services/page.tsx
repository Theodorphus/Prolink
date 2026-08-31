import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import ServiceFilters from '@/components/services/ServiceFilters'
import { getCategoryLabel } from '@/lib/categories'

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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tjänster</h1>
          <p className="text-gray-600 mt-1">{services?.length ?? 0} tillgängliga tjänster</p>
        </div>
        {isProvider && (
          <Link
            href="/services/create"
            className="inline-flex items-center bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Ny tjänst
          </Link>
        )}
      </div>

      <Suspense>
        <ServiceFilters />
      </Suspense>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services?.map((service: any) => (
          <Link key={service.id} href={`/services/${service.id}`} className="group block">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardBody className="flex flex-col gap-3 h-full">
                <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-3 flex-1">{service.description}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                    {service.provider?.avatar_url ? (
                      <Image src={service.provider.avatar_url} alt={service.provider.name} fill className="object-cover" />
                    ) : (
                      service.provider?.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-1 truncate">{service.provider?.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(service.price)}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
                    {service.delivery_time}
                  </span>
                </div>
                {service.category && (
                  <span className="self-start text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                    {getCategoryLabel(service.category)}
                  </span>
                )}
              </CardBody>
            </Card>
          </Link>
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
