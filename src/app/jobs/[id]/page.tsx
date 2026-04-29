import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import OfferCard from '@/components/offers/OfferCard'
import CloseJobButton from '@/components/jobs/CloseJobButton'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('title').eq('id', params.id).single()
  return { title: data?.title ?? 'Uppdrag' }
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, customer:users(id, name, bio, avatar_url), offers(*, provider:users(id, name, avatar_url, hourly_rate))')
    .eq('id', params.id)
    .single()

  if (!job) notFound()

  const isOwner = user?.id === job.customer_id

  const { data: userProfile } = user
    ? await supabase.from('users').select('role').eq('id', user.id).single()
    : { data: null }

  const isProvider = user && !isOwner && userProfile?.role === 'provider'
  const isCustomerNotOwner = user && !isOwner && userProfile?.role === 'customer'

  // Kolla om denna leverantör redan skickat offert
  const existingOffer = isProvider
    ? job.offers?.find((o: any) => o.provider_id === user.id)
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
              <Link href={`/profile/${job.customer.id}`} className="hover:text-blue-600">
                {job.customer.name}
              </Link>
              <span>•</span>
              <span>{formatDate(job.created_at)}</span>
              {job.budget && (
                <>
                  <span>•</span>
                  <span className="font-medium text-blue-600">{formatCurrency(job.budget)}</span>
                </>
              )}
            </div>
            <Card>
              <CardBody>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </CardBody>
            </Card>
          </div>

          {/* Offers */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Offerter ({job.offers?.length ?? 0})
            </h2>
            <div className="space-y-4">
              {job.offers?.map((offer: any) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isOwner={isOwner}
                  currentUserId={user?.id}
                />
              ))}
              {(!job.offers || job.offers.length === 0) && (
                <p className="text-gray-500 text-sm py-8 text-center">Inga offerter än — var den första!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Kund</h3>
            </CardHeader>
            <CardBody>
              <Link href={`/profile/${job.customer.id}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                  {job.customer.name?.[0]?.toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{job.customer.name}</span>
              </Link>
              {job.customer.bio && (
                <p className="text-sm text-gray-600 mt-3">{job.customer.bio}</p>
              )}
            </CardBody>
          </Card>

          {/* Info for customers visiting someone else's job */}
          {isCustomerNotOwner && job.status === 'open' && (
            <Card>
              <CardBody className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">Endast för leverantörer</p>
                <p className="text-xs text-gray-500">Offerter kan bara skickas av leverantörer. Byt roll under din profil om du vill offerera på uppdrag.</p>
                <Link
                  href={`/profile/${user!.id}`}
                  className="inline-flex items-center justify-center text-xs font-medium text-blue-600 hover:underline"
                >
                  Gå till min profil →
                </Link>
              </CardBody>
            </Card>
          )}

          {/* CTA for providers */}
          {isProvider && job.status === 'open' && (
            <Card>
              <CardBody>
                {existingOffer ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Du har redan skickat en offert.</p>
                    <Link
                      href={`/offers/${existingOffer.id}`}
                      className="block w-full text-center bg-gray-100 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Visa din offert
                    </Link>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Intresserad av uppdraget?</p>
                    <Link
                      href={`/jobs/${job.id}/offer`}
                      className="block w-full text-center bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Skicka offert
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Owner controls — hide if an offer is already accepted/in progress */}
          {isOwner && job.status === 'open' && !job.offers?.some((o: any) => ['accepted', 'delivered'].includes(o.status)) && (
            <CloseJobButton jobId={job.id} />
          )}
          {isOwner && !job.offers?.some((o: any) => ['accepted', 'delivered', 'completed'].includes(o.status)) && (
            <DeleteJobButton jobId={job.id} />
          )}
        </div>
      </div>
    </div>
  )
}
