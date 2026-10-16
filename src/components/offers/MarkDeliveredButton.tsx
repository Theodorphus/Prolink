'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { useT } from '@/i18n/client'

export default function MarkDeliveredButton({ offerId }: { offerId: string }) {
  const router = useRouter()
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handle() {
    if (!confirm(t('Markera uppdraget som levererat? Kunden kommer att bekräfta slutförandet.'))) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
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
      setLoading(false)
    }
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardBody>
        <p className="text-sm text-gray-700 mb-3 font-medium">{t('Är arbetet klart?')}</p>
        <p className="text-xs text-gray-500 mb-4">
          {t('Markera som levererat när du är klar. Kunden bekräftar sedan att uppdraget är slutfört.')}
        </p>
        {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
        <Button className="w-full" onClick={handle} loading={loading}>
          {t('✓ Markera som levererat')}
        </Button>
      </CardBody>
    </Card>
  )
}
