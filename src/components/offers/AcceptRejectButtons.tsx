'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function AcceptRejectButtons({ offerId }: { offerId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  async function update(status: 'accepted' | 'rejected') {
    setLoading(status === 'accepted' ? 'accept' : 'reject')
    const res = await fetch(`/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) router.refresh()
    setLoading(null)
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardBody>
        <p className="text-sm text-gray-700 mb-4 font-medium">Vad vill du göra med den här offerten?</p>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => update('accepted')}
            loading={loading === 'accept'}
            disabled={!!loading}
          >
            ✓ Acceptera offert
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => update('rejected')}
            loading={loading === 'reject'}
            disabled={!!loading}
          >
            ✕ Avslå offert
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
