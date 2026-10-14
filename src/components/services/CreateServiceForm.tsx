'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import ServiceFields, { serviceFormPayload } from './ServiceFields'

export default function CreateServiceForm() {
  const requestId = useRef<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
    const form = new FormData(e.currentTarget)

    requestId.current ??= crypto.randomUUID()
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId.current, ...serviceFormPayload(form) }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    router.push(`/services/${data.id}`)
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <ServiceFields />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Avbryt</Button>
            <Button type="submit" loading={loading}>Publicera tjänst</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
