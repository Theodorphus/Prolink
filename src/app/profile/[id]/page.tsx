import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Image from 'next/image'
import EditProfileForm from '@/components/profile/EditProfileForm'
import SwitchRoleButton from '@/components/profile/SwitchRoleButton'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'

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

  // Find existing shared conversation (offer between viewer and profile owner)
  let sharedOffer: { id: string } | null = null
  if (user && !isOwn) {
    // Viewer is customer, profile is provider: look for offer where viewer's job was offered by profile owner
    if (profile.role === 'provider') {
      const { data } = await supabase
        .from('offers')
        .select('id')
        .eq('provider_id', params.id)
        .in('status', ['accepted', 'delivered', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      // Verify viewer is the customer of that job
      if (data) {
        const { data: offer } = await supabase
          .from('offers')
          .select('id, job:jobs(customer_id)')
          .eq('id', data.id)
          .single()
        const jobCustomer = Array.isArray((offer as any)?.job) ? (offer as any).job[0]?.customer_id : (offer as any)?.job?.customer_id
        if (jobCustomer === user.id) sharedOffer = data
      }
    }
    // Viewer is provider, profile is customer: look for offer by viewer on profile's jobs
    if (profile.role === 'customer') {
      const { data: myJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('customer_id', params.id)
      const jobIds = myJobs?.map((j: any) => j.id) ?? []
      if (jobIds.length > 0) {
        const { data } = await supabase
          .from('offers')
          .select('id')
          .eq('provider_id', user.id)
          .in('job_id', jobIds)
          .in('status', ['accepted', 'delivered', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        sharedOffer = data
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar: Profile card */}
        <div className="space-y-4">
          <Card>
            <CardBody className="text-center space-y-3">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-3xl mx-auto">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" />
                ) : (
                  profile.name?.[0]?.toUpperCase()
                )}
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
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn-profil
                </a>
              )}
              <p className="text-xs text-gray-400">Medlem sedan {formatDate(profile.created_at)}</p>
              {isOwn && (
                <SwitchRoleButton currentRole={profile.role} userId={profile.id} />
              )}
            </CardBody>
          </Card>

          {/* Kontaktkort — visas bara för inloggade som tittar på annans profil */}
          {user && !isOwn && (
            <Card>
              <CardBody className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Kontakta {profile.name.split(' ')[0]}</h3>

                {sharedOffer ? (
                  <Link
                    href={`/messages/${sharedOffer.id}`}
                    className="flex items-center gap-2 w-full bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Öppna konversation
                  </Link>
                ) : profile.role === 'provider' ? (
                  <>
                    <p className="text-xs text-gray-500">Lägg ut ett uppdrag för att ta emot offerter från {profile.name.split(' ')[0]}.</p>
                    <Link
                      href="/jobs/create"
                      className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Lägg ut uppdrag
                    </Link>
                    {services && services.length > 0 && (
                      <Link
                        href={`/services/${services[0].id}`}
                        className="flex items-center justify-center w-full bg-gray-100 text-gray-800 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Se tjänster
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">Bläddra bland {profile.name.split(' ')[0]}s aktiva uppdrag och skicka en offert.</p>
                    <Link
                      href="/jobs"
                      className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Hitta uppdrag
                    </Link>
                  </>
                )}
              </CardBody>
            </Card>
          )}
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
                  <Link
                    href="/services/create"
                    className="inline-flex items-center bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Ny tjänst
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
                  <Link
                    href="/jobs/create"
                    className="inline-flex items-center bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Nytt uppdrag
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                {jobs?.map((job: any) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardBody className="flex items-center justify-between gap-4">
                      <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0 group">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 truncate">{job.title}</h3>
                        <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
                      </Link>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={job.status === 'open' ? 'success' : 'default'}>
                          {job.status === 'open' ? 'Öppet' : 'Stängt'}
                        </Badge>
                        {isOwn && (
                          <DeleteJobButton jobId={job.id} compact />
                        )}
                      </div>
                    </CardBody>
                  </Card>
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
