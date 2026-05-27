'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function CompleteJobButton({ offerId }: { offerId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handle() {
    if (!confirm('Bekräfta att uppdraget är slutfört? Jobbet stängs och kan inte återöppnas.')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Något gick fel.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardBody>
        <p className="text-sm text-gray-700 mb-3 font-medium">Leverantören har markerat arbetet som klart.</p>
        <p className="text-xs text-gray-500 mb-4">
          Bekräfta när du är nöjd med leveransen. Uppdraget stängs och leverantören kan fakturera dig.
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <Button className="w-full" onClick={handle} loading={loading}>
          ✓ Bekräfta och stäng uppdraget
        </Button>
      </CardBody>
    </Card>
  )
}
