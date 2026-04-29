'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardBody, CardFooter } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface OfferCardProps {
  offer: any
  isOwner: boolean
  currentUserId?: string
}

export default function OfferCard({ offer, isOwner, currentUserId }: OfferCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  async function updateStatus(status: 'accepted' | 'rejected') {
    setLoading(status === 'accepted' ? 'accept' : 'reject')
    const res = await fetch(`/api/offers/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) router.refresh()
    setLoading(null)
  }

  const isOwnOffer = currentUserId === offer.provider_id

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 text-sm">
              {offer.provider?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <Link href={`/profile/${offer.provider_id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">
                {offer.provider?.name}
              </Link>
              <p className="text-xs text-gray-400">{offer.price_type === 'hourly' ? 'Timpris' : 'Fast pris'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-blue-600">{formatCurrency(offer.price)}</p>
            <StatusBadge status={offer.status} />
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{offer.description}</p>
        <p className="text-xs text-gray-400">Tidsestimat: {offer.timeline}</p>
      </CardBody>

      {(isOwner || isOwnOffer) && (
        <CardFooter>
          <div className="flex gap-3">
            <Link
              href={`/offers/${offer.id}`}
              className="flex-1 text-center bg-gray-100 text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {isOwnOffer ? 'Din offert' : 'Visa detaljer & chatta'}
            </Link>
            {isOwner && offer.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateStatus('accepted')}
                  loading={loading === 'accept'}
                  disabled={!!loading}
                >
                  Acceptera
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => updateStatus('rejected')}
                  loading={loading === 'reject'}
                  disabled={!!loading}
                >
                  Avslå
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
