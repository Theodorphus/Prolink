import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('services').select('title').eq('id', params.id).single()
  return { title: data?.title ?? 'Tjänst' }
}

export default async function ServicePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: service } = await supabase
    .from('services')
    .select('*, provider:users(id, name, bio, avatar_url, skills, hourly_rate)')
    .eq('id', params.id)
    .single()

  if (!service) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h1>
            <p className="text-sm text-gray-400">Publicerad {formatDate(service.created_at)}</p>
          </div>

          <Card>
            <CardBody>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{service.description}</p>
            </CardBody>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardBody className="flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(service.price)}</p>
                <p className="text-sm text-blue-600">Leverans: {service.delivery_time}</p>
              </div>
              <Link href={`/jobs/create`}>
                <Button>Lägg ut uppdrag</Button>
              </Link>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar: Provider */}
        <div>
          <Card>
            <CardBody className="space-y-4">
              <Link href={`/profile/${service.provider.id}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl">
                  {service.provider.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{service.provider.name}</p>
                  {service.provider.hourly_rate && (
                    <p className="text-sm text-gray-400">{formatCurrency(service.provider.hourly_rate)}/h</p>
                  )}
                </div>
              </Link>

              {service.provider.bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{service.provider.bio}</p>
              )}

              {service.provider.skills && service.provider.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {service.provider.skills.map((skill: string) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <Link href={`/profile/${service.provider.id}`} className="block">
                <Button variant="secondary" className="w-full" size="sm">
                  Visa profil
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
