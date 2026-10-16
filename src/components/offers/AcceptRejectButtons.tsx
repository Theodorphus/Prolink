'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { useT } from '@/i18n/client'

export default function AcceptRejectButtons({ offerId, version }: { offerId: string; version: string | null }) {
  const router = useRouter()
  const t = useT()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState('')

  async function update(status: 'accepted' | 'rejected') {
    setLoading(status === 'accepted' ? 'accept' : 'reject')
    setError('')
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, seen_version: version }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(t(data.error ?? 'Något gick fel.'))
      }
    } catch {
      setError(t('Kunde inte uppdatera. Kontrollera anslutningen och försök igen.'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardBody>
        <p className="text-sm text-gray-700 mb-4 font-medium">{t('Vad vill du göra med den här offerten?')}</p>
        {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => update('accepted')}
            loading={loading === 'accept'}
            disabled={!!loading}
          >
            {t('✓ Acceptera offert')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => update('rejected')}
            loading={loading === 'reject'}
            disabled={!!loading}
          >
            {t('✕ Avslå offert')}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
