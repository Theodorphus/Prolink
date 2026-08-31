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
          <Link key={service.id} href={`/services/${service.id}`} className="group block">
            <Card interactive className="h-full">
              <CardBody className="flex h-full flex-col gap-3">
                {service.category && (
                  <span className="self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                    {getCategoryLabel(service.category)}
                  </span>
                )}
                <h2 className="text-base font-bold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
                  {service.title}
                </h2>
                <p className="line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>

                <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3.5">
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {service.provider?.avatar_url ? (
                      <Image src={service.provider.avatar_url} alt={service.provider.name} fill className="object-cover" />
                    ) : (
                      service.provider?.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="flex-1 truncate text-xs font-medium text-slate-600">{service.provider?.name}</span>
                </div>

                {/* Pris är det som avgör klicket, så det får störst vikt. */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-black tracking-[-0.02em] text-slate-900">{formatCurrency(service.price)}</p>
                    <p className="text-xs font-medium text-slate-400">fast pris</p>
                  </div>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                    {service.delivery_time}
                  </span>
                </div>
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
