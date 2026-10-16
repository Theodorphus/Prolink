'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import JobFields from './JobFields'
import { useLocalePath, useT } from '@/i18n/client'

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
  const t = useT()
  const localePath = useLocalePath()
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
      router.push(localePath(`/register?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`))
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
      setError(t(data.error ?? 'Uppdraget kunde inte publiceras.'))
      setLoading(false)
      return
    }
    clearDraft(draftKey)
    router.push(localePath(`/jobs/${data.id}`))
    } catch {
      setError(t('Kunde inte spara. Kontrollera anslutningen och försök igen.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={event => writeDraft(draftKey, event.currentTarget)} className="space-y-6">
      {restored && (
        <div role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          {signedIn ? (target ? t('Det du skrev finns kvar. Granska och skicka förfrågan när du är redo.') : t('Det du skrev finns kvar. Granska och publicera när du är redo.')) : t('Ditt utkast finns kvar.')}
        </div>
      )}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <JobFields defaults={{ title: target?.title ? `${t('Förfrågan:')} ${target.title}`.slice(0, 120) : undefined, category: target?.category ?? initialCategory }} />
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-4 text-base font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? t('Publicerar…') : target ? t('Skicka förfrågan') : t('Publicera uppdrag')}</button>
      <p className="text-center text-xs font-medium text-slate-500">
        {signedIn
          ? t('Du kan granska inkomna offerter och väljer själv vem du vill gå vidare med.')
          : t('I nästa steg skapar du ett gratis konto. Det du skrivit sparas och du kommer tillbaka hit.')}
      </p>
    </form>
  )
}
