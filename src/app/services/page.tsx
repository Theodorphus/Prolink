import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Tjänster' }

export default async function ServicesPage() {
  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('*, provider:users(id, name, avatar_url, hourly_rate)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tjänster</h1>
          <p className="text-gray-600 mt-1">{services?.length ?? 0} tillgängliga tjänster</p>
        </div>
        <Link href="/services/create">
          <Button>+ Ny tjänst</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services?.map((service: any) => (
          <Link key={service.id} href={`/services/${service.id}`} className="group">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardBody className="flex flex-col gap-3 h-full">
                <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-3 flex-1">{service.description}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                    {service.provider?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-500 flex-1">{service.provider?.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(service.price)}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
                    {service.delivery_time}
                  </span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
        {(!services || services.length === 0) && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <p className="text-lg">Inga tjänster ännu.</p>
            <Link href="/services/create" className="mt-4 inline-block">
              <Button>Lägg till den första tjänsten</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
