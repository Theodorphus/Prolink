'use client'

import { useState } from 'react'
import Link from '@/components/i18n/Link'
import { useRouter } from 'next/navigation'
import JobFields, { type JobFieldValues } from './JobFields'
import { useLocalePath, useT } from '@/i18n/client'

export default function EditJobForm({ jobId, defaults }: { jobId: string; defaults: JobFieldValues }) {
  const router = useRouter()
  const t = useT()
  const localePath = useLocalePath()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData(event.currentTarget)
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          description: form.get('description'),
          category: form.get('category'),
          budget: form.get('budget'),
          location: form.get('location'),
          work_type: form.get('work_type'),
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(t(data?.error ?? 'Ändringarna kunde inte sparas.'))
        return
      }
      router.push(localePath(`/jobs/${jobId}`))
      router.refresh()
    } catch {
      setError(t('Kunde inte spara. Kontrollera anslutningen och försök igen.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <JobFields defaults={defaults} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Link href={`/jobs/${jobId}`} className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-center text-base font-bold text-slate-700 transition hover:border-slate-300">
          {t('Avbryt')}
        </Link>
        <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 py-4 text-base font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? t('Sparar…') : t('Spara ändringar')}
        </button>
      </div>
    </form>
  )
}
