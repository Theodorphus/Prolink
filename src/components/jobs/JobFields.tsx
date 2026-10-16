'use client'

import { localizedCategories } from '@/lib/categories'
import { useT } from '@/i18n/client'

export type JobFieldValues = Partial<Record<'title' | 'category' | 'description' | 'budget' | 'work_type' | 'location', string>>

const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

/** Uppdragets fält, gemensamma för att publicera och redigera. */
export default function JobFields({ defaults = {} }: { defaults?: JobFieldValues }) {
  const t = useT()
  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div><label htmlFor="job-title" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Vad behöver du hjälp med?')}</label><input id="job-title" className={fieldClass} name="title" defaultValue={defaults.title} required minLength={3} maxLength={120} placeholder={t('T.ex. Bygga en ny webbplats för vårt företag')} /></div>
      <div><label htmlFor="job-category" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Kategori')}</label><select id="job-category" className={fieldClass} name="category" required defaultValue={defaults.category ?? ''}><option value="" disabled>{t('Välj kategori')}</option>{localizedCategories(t).map(category => <option key={category.value} value={category.value}>{category.label}</option>)}</select></div>
      <div><label htmlFor="job-description" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Beskriv uppdraget')}</label><textarea id="job-description" className={`${fieldClass} resize-y`} name="description" defaultValue={defaults.description} required minLength={10} maxLength={5000} rows={7} placeholder={t('Beskriv nuläge, önskat resultat, omfattning och sådant leverantören behöver känna till.')} /><p className="mt-1.5 text-xs text-slate-500">{t('En tydlig brief ger bättre och mer jämförbara offerter.')}</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="job-budget" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Budget, SEK')} <span className="font-normal text-slate-400">({t('valfritt')})</span></label><input id="job-budget" className={fieldClass} name="budget" type="number" min="1" step="1" defaultValue={defaults.budget} placeholder={t('T.ex. 25000')} /></div><div><label htmlFor="job-work-type" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Arbetsform')}</label><select id="job-work-type" className={fieldClass} name="work_type" defaultValue={defaults.work_type ?? ''}><option value="">{t('Inte specificerat')}</option><option value="remote">{t('På distans')}</option><option value="onsite">{t('På plats')}</option><option value="hybrid">{t('Hybrid')}</option></select></div></div>
      <div><label htmlFor="job-location" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Plats')} <span className="font-normal text-slate-400">({t('om relevant')})</span></label><input id="job-location" className={fieldClass} name="location" defaultValue={defaults.location} maxLength={120} placeholder={t('T.ex. Stockholm eller Hela Sverige')} /></div>
    </div>
  )
}
