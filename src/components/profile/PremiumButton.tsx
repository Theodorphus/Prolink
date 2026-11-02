'use client'

import { useState } from 'react'
import { useT } from '@/i18n/client'

// Både "Uppgradera" och "Hantera prenumeration" skickar till Stripe, så en
// knapp räcker: rutten avgör vart användaren ska.
export default function PremiumButton({ endpoint, label, className }: { endpoint: '/api/premium/checkout' | '/api/premium/portal'; label: string; className: string }) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function go() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(endpoint, { method: 'POST' })
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
      <button type="button" onClick={go} disabled={loading} className={`${className} disabled:opacity-60`}>
        {loading ? t('Öppnar...') : label}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </>
  )
}
