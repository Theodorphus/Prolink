'use client'

import { Input } from '@/components/ui/Input'
import { useT } from '@/i18n/client'
import { Textarea } from '@/components/ui/Textarea'
import { localizedCategories } from '@/lib/categories'

export type ServiceFieldValues = Partial<Record<'title' | 'description' | 'category' | 'price' | 'delivery_time', string>> & {
  vat?: 'unknown' | 'included' | 'excluded'
}

/** Tjänstens fält, gemensamma för att publicera och redigera. */
export default function ServiceFields({ defaults = {} }: { defaults?: ServiceFieldValues }) {
  const t = useT()
  return (
    <>
      <Input label={t('Titel')} name="title" minLength={3} maxLength={120} required defaultValue={defaults.title} placeholder={t('T.ex. Designa en logotyp')} />

      <Textarea
        label={t('Beskrivning')}
        name="description" minLength={10} maxLength={5000}
        required
        rows={5}
        defaultValue={defaults.description}
        placeholder={t('Beskriv vad som ingår, antal revisioner, om moms ingår och vad kunden behöver förbereda.')}
      />

      <div className="space-y-1.5">
        <label htmlFor="service-category" className="block text-sm font-medium text-gray-700">
          {t('Kategori')} <span className="text-red-500">*</span>
        </label>
        <select
          id="service-category"
          name="category"
          required
          defaultValue={defaults.category ?? ''}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">{t('Välj kategori...')}</option>
          {localizedCategories(t).map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label={t('Frånpris (SEK)')} name="price" type="number" min="1" required defaultValue={defaults.price} placeholder={t('T.ex. 4500')} />
        <Input label={t('Leveranstid')} name="delivery_time" minLength={2} maxLength={120} required defaultValue={defaults.delivery_time} placeholder={t('T.ex. 5 arbetsdagar')} />
      </div>

      <label className="block text-sm font-medium">{t('Moms')}
        <select name="vat" defaultValue={defaults.vat ?? 'unknown'} className="mt-1 w-full rounded-xl border p-3">
          <option value="unknown">{t('Moms behöver avtalas')}</option><option value="included">{t('Priset inkluderar moms')}</option><option value="excluded">{t('Moms tillkommer')}</option>
        </select>
      </label>
    </>
  )
}

/** Läser formulärets fält till det API:et förväntar sig. */
export function serviceFormPayload(form: FormData) {
  return {
    title: form.get('title'),
    description: form.get('description'),
    price: Number(form.get('price')),
    delivery_time: form.get('delivery_time'),
    category: form.get('category') || null,
    vat_included: form.get('vat') === 'unknown' ? null : form.get('vat') === 'included',
  }
}
