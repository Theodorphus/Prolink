'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

// Utkastet sparas i webbläsaren så att en utloggad köpare kan skriva klart,
// skapa konto (även via bekräftelsemejlet) och komma tillbaka till samma text.
const FIELDS = ['title', 'category', 'description', 'budget', 'work_type', 'location'] as const

function readDraft(key: string): Record<string, string> | null {
  try {
    const draft = JSON.parse(localStorage.getItem(key) ?? 'null')
    return draft && typeof draft === 'object' ? draft : null
  } catch {
    return null
  }
}

function writeDraft(key: string, form: HTMLFormElement | null) {
  if (!form) return
  const data = new FormData(form)
  try {
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(FIELDS.map(name => [name, String(data.get(name) ?? '')]))))
  } catch {}
}

function clearDraft(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export default function CreateJobForm({ target, initialCategory, signedIn }: { target?: { id: string; name: string; serviceId?: string; title?: string; category?: string }; initialCategory?: string; signedIn: boolean }) {
  const requestId = useRef<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [restored, setRestored] = useState(false)
  const draftKey = `prolink:job-draft:${target?.serviceId ?? target?.id ?? 'public'}`

  useEffect(() => {
    const draft = readDraft(draftKey)
    const form = formRef.current
    if (!draft || !form) return
    let filled = false
    for (const name of FIELDS) {
      const field = form.elements.namedItem(name)
      if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) && draft[name]) {
        field.value = draft[name]
        filled = true
      }
    }
    setRestored(filled)
  }, [draftKey])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    if (!signedIn) {
      writeDraft(draftKey, event.currentTarget)
      router.push(`/register?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }
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
    clearDraft(draftKey)
    router.push(`/jobs/${data.id}`)
    } catch {
      setError('Kunde inte spara. Kontrollera anslutningen och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={event => writeDraft(draftKey, event.currentTarget)} className="space-y-6">
      {restored && (
        <div role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          {signedIn ? `Det du skrev finns kvar. Granska och ${target ? 'skicka förfrågan' : 'publicera'} när du är redo.` : 'Ditt utkast finns kvar.'}
        </div>
      )}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div><label htmlFor="job-title" className="mb-1.5 block text-sm font-bold text-slate-700">Vad behöver du hjälp med?</label><input id="job-title" className={fieldClass} name="title" defaultValue={target?.title ? `Förfrågan: ${target.title}`.slice(0, 120) : undefined} required minLength={3} maxLength={120} placeholder="T.ex. Bygga en ny webbplats för vårt företag" /></div>
        <div><label htmlFor="job-category" className="mb-1.5 block text-sm font-bold text-slate-700">Kategori</label><select id="job-category" className={fieldClass} name="category" required defaultValue={target?.category ?? initialCategory ?? ""}><option value="" disabled>Välj kategori</option>{CATEGORIES.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</select></div>
        <div><label htmlFor="job-description" className="mb-1.5 block text-sm font-bold text-slate-700">Beskriv uppdraget</label><textarea id="job-description" className={`${fieldClass} resize-y`} name="description" required minLength={10} maxLength={5000} rows={7} placeholder="Beskriv nuläge, önskat resultat, omfattning och sådant leverantören behöver känna till." /><p className="mt-1.5 text-xs text-slate-500">En tydlig brief ger bättre och mer jämförbara offerter.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="job-budget" className="mb-1.5 block text-sm font-bold text-slate-700">Budget, SEK <span className="font-normal text-slate-400">(valfritt)</span></label><input id="job-budget" className={fieldClass} name="budget" type="number" min="1" step="1" placeholder="T.ex. 25000" /></div><div><label htmlFor="job-work-type" className="mb-1.5 block text-sm font-bold text-slate-700">Arbetsform</label><select id="job-work-type" className={fieldClass} name="work_type" defaultValue=""><option value="">Inte specificerat</option><option value="remote">På distans</option><option value="onsite">På plats</option><option value="hybrid">Hybrid</option></select></div></div>
        <div><label htmlFor="job-location" className="mb-1.5 block text-sm font-bold text-slate-700">Plats <span className="font-normal text-slate-400">(om relevant)</span></label><input id="job-location" className={fieldClass} name="location" maxLength={120} placeholder="T.ex. Stockholm eller Hela Sverige" /></div>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-4 text-base font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Publicerar…' : target ? 'Skicka förfrågan' : 'Publicera uppdrag'}</button>
      <p className="text-center text-xs font-medium text-slate-500">
        {signedIn
          ? 'Du kan granska inkomna offerter och väljer själv vem du vill gå vidare med.'
          : 'I nästa steg skapar du ett gratis konto. Det du skrivit sparas och du kommer tillbaka hit.'}
      </p>
    </form>
  )
}
