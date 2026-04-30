'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { CATEGORIES } from '@/lib/categories'

export default function CreateServiceForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.get('title'),
        description: form.get('description'),
        price: Number(form.get('price')),
        delivery_time: form.get('delivery_time'),
        category: form.get('category') || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    router.push(`/services/${data.id}`)
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <Input label="Titel" name="title" required placeholder="T.ex. Designa en logotyp" />

          <Textarea
            label="Beskrivning"
            name="description"
            required
            rows={5}
            placeholder="Beskriv tjänsten i detalj — vad levererar du, hur går processen till, vad behöver kunden förbereda?"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
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
            <Input label="Pris (SEK)" name="price" type="number" min="1" required placeholder="T.ex. 4500" />
            <Input label="Leveranstid" name="delivery_time" required placeholder="T.ex. 5 arbetsdagar" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Avbryt</Button>
            <Button type="submit" loading={loading}>Publicera tjänst</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
