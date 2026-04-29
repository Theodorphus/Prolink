'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function CreateOfferForm({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'hourly'>('fixed')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        price: Number(form.get('price')),
        price_type: priceType,
        timeline: form.get('timeline'),
        description: form.get('description'),
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    router.push(`/offers/${data.id}`)
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {/* Pristyp */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Pristyp</label>
            <div className="grid grid-cols-2 gap-3">
              {(['fixed', 'hourly'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPriceType(type)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    priceType === type
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm">{type === 'fixed' ? 'Fast pris' : 'Timpris'}</p>
                  <p className="text-xs text-gray-500">{type === 'fixed' ? 'Totalt belopp' : 'Per timme'}</p>
                </button>
              ))}
            </div>
          </div>

          <Input
            label={priceType === 'fixed' ? 'Totalt pris (SEK)' : 'Timpris (SEK/h)'}
            name="price"
            type="number"
            min="1"
            required
            placeholder={priceType === 'fixed' ? 'T.ex. 12000' : 'T.ex. 850'}
          />

          <Input
            label="Tidsestimat / Leveranstid"
            name="timeline"
            required
            placeholder="T.ex. 10 arbetsdagar, 2 veckor"
          />

          <Textarea
            label="Offertbeskrivning"
            name="description"
            required
            rows={6}
            placeholder="Beskriv vad du ska leverera, hur du tänker lösa uppdraget och varför du är rätt person..."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Avbryt
            </Button>
            <Button type="submit" loading={loading}>
              Skicka offert
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
