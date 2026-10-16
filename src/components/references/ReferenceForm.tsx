'use client'

import { useState } from 'react'
import Link from '@/components/i18n/Link'
import StarRating from '@/components/reviews/StarRating'
import { Button } from '@/components/ui/Button'
import { useT } from '@/i18n/client'

const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

export default function ReferenceForm({ token, providerName, providerId }: { token: string; providerName: string; providerId: string }) {
  const t = useT()
  const [rating, setRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    if (!rating) { setError(t('Välj ett betyg.')); return }
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/references/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: form.get('client_name'),
          client_company: form.get('client_company'),
          comment: form.get('comment'),
          confirm: form.get('confirm') === 'on',
          rating,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) setError(t(data.error ?? 'Omdömet kunde inte sparas.'))
      else setDone(true)
    } catch {
      setError(t('Kunde inte spara. Kontrollera anslutningen och försök igen.'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div role="status" className="surface p-6 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">{t('Tack för ditt omdöme!')}</p>
        <p className="mt-1">{t('Det syns nu på profilen för {name}.', { name: providerName })}</p>
        <Link href={`/profile/${providerId}`} className="mt-3 inline-block font-semibold text-blue-700 hover:underline">{t('Se profilen')}</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="surface space-y-5 p-6">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-700">{t('Betyg')}</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label htmlFor="reference-comment" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Ditt omdöme')} <span className="font-normal text-slate-400">({t('valfritt')})</span></label>
        <textarea id="reference-comment" name="comment" rows={5} maxLength={2000} className={`${fieldClass} resize-y`} placeholder={t('Vad hjälpte {name} dig med, och hur gick det?', { name: providerName })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reference-name" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Ditt namn')}</label>
          <input id="reference-name" name="client_name" required maxLength={100} autoComplete="name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="reference-company" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Företag')} <span className="font-normal text-slate-400">({t('valfritt')})</span></label>
          <input id="reference-company" name="client_company" maxLength={120} autoComplete="organization" className={fieldClass} />
        </div>
      </div>
      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input type="checkbox" name="confirm" required className="mt-0.5" />
        <span>{t('Jag har anlitat {name} och omdömet beskriver min egen erfarenhet.', { name: providerName })}</span>
      </label>
      <Button type="submit" className="w-full" loading={loading}>{t('Skicka omdöme')}</Button>
    </form>
  )
}
