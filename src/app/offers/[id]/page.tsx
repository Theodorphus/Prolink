import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import AcceptRejectButtons from '@/components/offers/AcceptRejectButtons'

export async function generateMetadata(_: { params: { id: string } }) {
  return { title: 'Offert' }
}

export default async function OfferPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: offer } = await supabase
    .from('offers')
    .select('*, provider:users(id, name, bio, avatar_url, skills, hourly_rate), job:jobs(id, title, description, budget, customer_id, customer:users(id, name))')
    .eq('id', params.id)
    .single()

  if (!offer) notFound()

  const isCustomer = user.id === offer.job.customer_id
  const isProvider = user.id === offer.provider_id

  if (!isCustomer && !isProvider) redirect('/')

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Offer details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={`/jobs/${offer.job.id}`} className="text-sm text-blue-600 hover:underline">
                ← {offer.job.title}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Offert</h1>
            </div>
            <StatusBadge status={offer.status} />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Offertdetaljer</h2>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(offer.price)}</p>
                  <p className="text-xs text-gray-400">{offer.price_type === 'fixed' ? 'Fast pris' : 'Per timme'}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Tidsestimat</p>
                <p className="text-gray-700">{offer.timeline}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Beskrivning</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{offer.description}</p>
              </div>
              <p className="text-xs text-gray-400">Skickad {formatDate(offer.created_at)}</p>
            </CardBody>
          </Card>

          {/* Accept / Reject (only customer, only pending) */}
          {isCustomer && offer.status === 'pending' && (
            <AcceptRejectButtons offerId={offer.id} />
          )}

          {/* Chat link */}
          {(offer.status === 'accepted' || isCustomer || isProvider) && (
            <Link href={`/messages/${offer.id}`}>
              <Button className="w-full" variant={offer.status === 'accepted' ? 'primary' : 'secondary'}>
                {offer.status === 'accepted' ? 'Öppna chatten' : 'Chatta om offerten'}
              </Button>
            </Link>
          )}
        </div>

        {/* Right: Provider info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Leverantör</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Link href={`/profile/${offer.provider.id}`} className="flex items-center gap-3 hover:opacity-80">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                  {offer.provider.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{offer.provider.name}</p>
                  {offer.provider.hourly_rate && (
                    <p className="text-xs text-gray-400">{formatCurrency(offer.provider.hourly_rate)}/h</p>
                  )}
                </div>
              </Link>
              {offer.provider.bio && (
                <p className="text-sm text-gray-600">{offer.provider.bio}</p>
              )}
              {offer.provider.skills && offer.provider.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {offer.provider.skills.map((skill: string) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Uppdrag</h3>
            </CardHeader>
            <CardBody>
              <Link href={`/jobs/${offer.job.id}`} className="hover:text-blue-600">
                <p className="font-medium text-gray-900">{offer.job.title}</p>
              </Link>
              {offer.job.budget && (
                <p className="text-sm text-blue-600 mt-1">Budget: {formatCurrency(offer.job.budget)}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">Kund: {offer.job.customer?.name}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
