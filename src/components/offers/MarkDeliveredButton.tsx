'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function MarkDeliveredButton({ offerId }: { offerId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!confirm('Markera uppdraget som levererat? Kunden kommer att bekräfta slutförandet.')) return
    setLoading(true)
    const res = await fetch(`/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    })
    if (res.ok) router.refresh()
    setLoading(false)
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardBody>
        <p className="text-sm text-gray-700 mb-3 font-medium">Är arbetet klart?</p>
        <p className="text-xs text-gray-500 mb-4">
          Markera som levererat när du är klar. Kunden bekräftar sedan att uppdraget är slutfört.
        </p>
        <Button className="w-full" onClick={handle} loading={loading}>
          ✓ Markera som levererat
        </Button>
      </CardBody>
    </Card>
  )
}
