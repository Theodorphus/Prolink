'use client'

import { useState } from 'react'
import { useT } from '@/i18n/client'

export default function BoostJobButton({ jobId, label }: { jobId: string; label: string }) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function go() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/jobs/${jobId}/boost`, { method: 'POST' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.url) throw new Error(body.error)
      window.location.assign(body.url)
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? t(caught.message) : t('Något gick fel. Försök igen.'))
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="block w-full rounded-xl bg-blue-700 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
      >
        {loading ? t('Öppnar...') : label}
      </button>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </>
  )
}
