'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

export default function CreateJobForm({ target }: { target?: { id: string; name: string; serviceId?: string; title?: string; category?: string } }) {
  const requestId = useRef<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
    const form = new FormData(event.currentTarget)
    requestId.current ??= crypto.randomUUID()
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: requestId.current,
        service_id: target?.serviceId,
        requested_provider_id: target?.id,
        title: form.get('title'),
        description: form.get('description'),
        category: form.get('category'),
        budget: form.get('budget'),
        location: form.get('location'),
        work_type: form.get('work_type'),
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data.error ?? 'Uppdraget kunde inte publiceras.')
      setLoading(false)
      return
    }
    router.push(`/jobs/${data.id}`)
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div><label htmlFor="job-title" className="mb-1.5 block text-sm font-bold text-slate-700">Vad behöver du hjälp med?</label><input id="job-title" className={fieldClass} name="title" defaultValue={target?.title ? `Förfrågan: ${target.title}`.slice(0, 120) : undefined} required minLength={3} maxLength={120} placeholder="T.ex. Bygga en ny webbplats för vårt företag" /></div>
        <div><label htmlFor="job-category" className="mb-1.5 block text-sm font-bold text-slate-700">Kategori</label><select id="job-category" className={fieldClass} name="category" required defaultValue={target?.category ?? ""}><option value="" disabled>Välj kategori</option>{CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</select></div>
        <div><label htmlFor="job-description" className="mb-1.5 block text-sm font-bold text-slate-700">Beskriv uppdraget</label><textarea id="job-description" className={`${fieldClass} resize-y`} name="description" required minLength={10} maxLength={5000} rows={7} placeholder="Beskriv nuläge, önskat resultat, omfattning och sådant leverantören behöver känna till." /><p className="mt-1.5 text-xs text-slate-500">En tydlig brief ger bättre och mer jämförbara offerter.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="job-budget" className="mb-1.5 block text-sm font-bold text-slate-700">Budget, SEK <span className="font-normal text-slate-400">(valfritt)</span></label><input id="job-budget" className={fieldClass} name="budget" type="number" min="1" step="1" placeholder="T.ex. 25000" /></div><div><label htmlFor="job-work-type" className="mb-1.5 block text-sm font-bold text-slate-700">Arbetsform</label><select id="job-work-type" className={fieldClass} name="work_type" defaultValue=""><option value="">Inte specificerat</option><option value="remote">På distans</option><option value="onsite">På plats</option><option value="hybrid">Hybrid</option></select></div></div>
        <div><label htmlFor="job-location" className="mb-1.5 block text-sm font-bold text-slate-700">Plats <span className="font-normal text-slate-400">(om relevant)</span></label><input id="job-location" className={fieldClass} name="location" maxLength={120} placeholder="T.ex. Stockholm eller Hela Sverige" /></div>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-4 text-base font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Publicerar…' : target ? 'Skicka förfrågan' : 'Publicera uppdrag'}</button>
      <p className="text-center text-xs font-medium text-slate-500">Du kan granska inkomna offerter och väljer själv vem du vill gå vidare med.</p>
    </form>
  )
}
