'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { CATEGORIES } from '@/lib/categories'

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
      body: JSON.stringify({
        id: requestId.current,
        title: form.get('title'),
        description: form.get('description'),
        price: Number(form.get('price')),
        delivery_time: form.get('delivery_time'),
        category: form.get('category') || null,
        vat_included: form.get('vat') === 'unknown' ? null : form.get('vat') === 'included',
      }),
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

          <Input label="Titel" name="title" minLength={3} maxLength={120} required placeholder="T.ex. Designa en logotyp" />

          <Textarea
            label="Beskrivning"
            name="description" minLength={10} maxLength={5000}
            required
            rows={5}
            placeholder="Beskriv vad som ingår, antal revisioner, om moms ingår och vad kunden behöver förbereda."
          />

          <div className="space-y-1.5">
            <label htmlFor="service-category" className="block text-sm font-medium text-gray-700">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              id="service-category"
              name="category"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Välj kategori...</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Frånpris (SEK)" name="price" type="number" min="1" required placeholder="T.ex. 4500" />
            <Input label="Leveranstid" name="delivery_time" minLength={2} maxLength={120} required placeholder="T.ex. 5 arbetsdagar" />
          </div>

          <label className="block text-sm font-medium">Moms
            <select name="vat" defaultValue="unknown" className="mt-1 w-full rounded-xl border p-3">
              <option value="unknown">Moms behöver avtalas</option><option value="included">Priset inkluderar moms</option><option value="excluded">Moms tillkommer</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Avbryt</Button>
            <Button type="submit" loading={loading}>Publicera tjänst</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
