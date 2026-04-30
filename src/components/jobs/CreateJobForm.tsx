'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/categories'

export default function CreateJobForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { setError('Du måste vara inloggad.'); setLoading(false); return }

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.get('title'),
        description: form.get('description'),
        budget: form.get('budget') ? Number(form.get('budget')) : null,
        category: form.get('category') || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    router.push(`/jobs/${data.id}`)
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <Input
            label="Titel"
            name="title"
            required
            placeholder="T.ex. Bygg en bokningssida för min salong"
          />

          <Textarea
            label="Beskrivning"
            name="description"
            required
            rows={6}
            placeholder="Beskriv uppdraget i detalj — vad ska göras, vilka krav har du, vad är tidplanen?"
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
            <Input
              label="Budget (SEK, valfritt)"
              name="budget"
              type="number"
              min="0"
              placeholder="T.ex. 15000"
            />
            <div className="flex items-end">
              <p className="text-sm text-gray-500 pb-2">Lämna tom för öppen budget</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Avbryt
            </Button>
            <Button type="submit" loading={loading}>
              Publicera uppdrag
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
