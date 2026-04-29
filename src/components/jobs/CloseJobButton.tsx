'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function CloseJobButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClose() {
    if (!confirm('Vill du stänga uppdraget? Det går inte att ångra.')) return
    setLoading(true)
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Card>
      <CardBody>
        <p className="text-sm text-gray-600 mb-3">Har du hittat en leverantör?</p>
        <Button variant="secondary" className="w-full" onClick={handleClose} loading={loading}>
          Stäng uppdraget
        </Button>
      </CardBody>
    </Card>
  )
}
