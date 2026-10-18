'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { useLocalePath, useT } from '@/i18n/client'

export interface OfferDefaults { price: string; price_type: 'fixed' | 'hourly'; timeline: string; description: string }

/** Skickar en ny offert, eller redigerar en befintlig när `edit` anges. */
export default function CreateOfferForm({ jobId, edit }: { jobId: string; edit?: { offerId: string; defaults: OfferDefaults } }) {
  const defaults = edit?.defaults
  const router = useRouter()
  const t = useT()
  const localePath = useLocalePath()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'hourly'>(defaults?.price_type ?? 'fixed')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'price' | 'timeline' | 'description', string>>>({})

  /** Samma gränser som servern (parseOfferContent), men synliga vid fältet i stället för en webbläsarbubbla som är lätt att missa. */
  function validate(form: FormData) {
    const errors: typeof fieldErrors = {}
    const price = Number(form.get('price'))
    if (!Number.isFinite(price) || price < 1) errors.price = t('Ange ett pris på minst 1 kr.')
    if (String(form.get('timeline') ?? '').trim().length < 2) errors.timeline = t('Ange en leveranstid på minst 2 tecken.')
    if (String(form.get('description') ?? '').trim().length < 10) errors.description = t('Beskriv offerten med minst 10 tecken.')
    return errors
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setError('')

    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const errors = validate(form)
    setFieldErrors(errors)
    const firstInvalid = (['price', 'timeline', 'description'] as const).find((name) => errors[name])
    if (firstInvalid) {
      formEl.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }

    setLoading(true)
    try {

    const res = await fetch(edit ? `/api/offers/${edit.offerId}` : '/api/offers', {
      method: edit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(edit ? {} : { job_id: jobId }),
        price: Number(form.get('price')),
        price_type: priceType,
        timeline: form.get('timeline'),
        description: form.get('description'),
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(t(data.error)); setLoading(false); return }

    router.push(localePath(`/offers/${data.id}`))
    if (edit) router.refresh()
    } catch { setError(t('Kunde inte skicka. Kontrollera anslutningen och försök igen.')) }
    finally { setLoading(false) }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {/* Pristyp */}
          <div className="space-y-2">
            <span id="pristyp-label" className="block text-sm font-medium text-gray-700">{t('Pristyp')}</span>
            <div role="radiogroup" aria-labelledby="pristyp-label" className="grid grid-cols-2 gap-3">
              {(['fixed', 'hourly'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={priceType === type}
                  onClick={() => setPriceType(type)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    priceType === type
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm">{type === 'fixed' ? t('Fast pris') : t('Timpris')}</p>
                  <p className="text-xs text-gray-500">{type === 'fixed' ? t('Totalt belopp') : t('Per timme')}</p>
                </button>
              ))}
            </div>
          </div>

          <Input
            label={priceType === 'fixed' ? t('Totalt pris (SEK)') : t('Timpris (SEK/h)')}
            name="price"
            type="number"
            min="1"
            required
            defaultValue={defaults?.price}
            error={fieldErrors.price}
            placeholder={priceType === 'fixed' ? t('T.ex. 12000') : t('T.ex. 850')}
          />

          <Input
            label={t('Tidsestimat / Leveranstid')}
            name="timeline" minLength={2} maxLength={120}
            required
            defaultValue={defaults?.timeline}
            error={fieldErrors.timeline}
            placeholder={t('T.ex. 10 arbetsdagar, 2 veckor')}
          />

          <Textarea
            label={t('Offertbeskrivning')}
            name="description" minLength={10} maxLength={5000}
            required
            rows={6}
            defaultValue={defaults?.description}
            error={fieldErrors.description}
            placeholder={t('Beskriv vad du ska leverera, hur du tänker lösa uppdraget och varför du är rätt person...')}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              {t('Avbryt')}
            </Button>
            <Button type="submit" loading={loading}>
              {edit ? t('Spara ändringar') : t('Skicka offert')}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
