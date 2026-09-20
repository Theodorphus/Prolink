'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function CloseJobButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Svaret kontrollerades inte tidigare: misslyckades anropet uppdaterades
  // sidan ändå, uppdraget låg kvar som öppet och användaren fick ingen
  // förklaring alls.
  async function handleClose() {
    if (!confirm('Vill du stänga uppdraget? Det går inte att ångra.')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Uppdraget kunde inte stängas.')
      }
    } catch {
      setError('Uppdraget kunde inte stängas. Kontrollera anslutningen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardBody>
        <p className="text-sm text-gray-600 mb-3">Har du hittat en leverantör?</p>
        {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
        <Button variant="secondary" className="w-full" onClick={handleClose} loading={loading}>
          Stäng uppdraget
        </Button>
      </CardBody>
    </Card>
  )
}
