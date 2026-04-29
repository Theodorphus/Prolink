import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import EditProfileForm from '@/components/profile/EditProfileForm'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('name').eq('id', params.id).single()
  return { title: data?.name ?? 'Profil' }
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const isOwn = user?.id === params.id

  // Load provider's services if provider
  const { data: services } = profile.role === 'provider'
    ? await supabase.from('services').select('*').eq('provider_id', params.id).order('created_at', { ascending: false })
    : { data: null }

  // Load customer's recent jobs if customer
  const { data: jobs } = profile.role === 'customer'
    ? await supabase.from('jobs').select('*').eq('customer_id', params.id).order('created_at', { ascending: false }).limit(5)
    : { data: null }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar: Profile card */}
        <div className="space-y-4">
          <Card>
            <CardBody className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-3xl mx-auto">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                <Badge variant={profile.role === 'provider' ? 'info' : 'default'} className="mt-1">
                  {profile.role === 'provider' ? 'Leverantör' : 'Kund'}
                </Badge>
              </div>
              {profile.hourly_rate && (
                <p className="text-blue-600 font-semibold">{formatCurrency(profile.hourly_rate)}/h</p>
              )}
              {profile.bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
              )}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {profile.skills.map((skill: string) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">Medlem sedan {formatDate(profile.created_at)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit form (own profile) */}
          {isOwn && <EditProfileForm profile={profile} />}

          {/* Provider: Services */}
          {profile.role === 'provider' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Tjänster</h2>
                {isOwn && (
                  <Link href="/services/create">
                    <Button size="sm">+ Ny tjänst</Button>
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {services?.map((service: any) => (
                  <Link key={service.id} href={`/services/${service.id}`} className="block group">
                    <Card className="group-hover:shadow-md transition-shadow">
                      <CardBody className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{service.title}</h3>
                          <p className="text-xs text-gray-400">{service.delivery_time}</p>
                        </div>
                        <span className="font-semibold text-blue-600">{formatCurrency(service.price)}</span>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
                {(!services || services.length === 0) && (
                  <p className="text-sm text-gray-500 py-4">Inga tjänster publicerade ännu.</p>
                )}
              </div>
            </div>
          )}

          {/* Customer: Jobs */}
          {profile.role === 'customer' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Senaste uppdrag</h2>
                {isOwn && (
                  <Link href="/jobs/create">
                    <Button size="sm">+ Nytt uppdrag</Button>
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {jobs?.map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
                    <Card className="group-hover:shadow-md transition-shadow">
                      <CardBody className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{job.title}</h3>
                          <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
                        </div>
                        <Badge variant={job.status === 'open' ? 'success' : 'default'}>
                          {job.status === 'open' ? 'Öppet' : 'Stängt'}
                        </Badge>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
                {(!jobs || jobs.length === 0) && (
                  <p className="text-sm text-gray-500 py-4">Inga uppdrag ännu.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
