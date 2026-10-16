import { getCategoryLabel } from '@/lib/categories'
import { OG_SIZE, renderOgImage } from '@/lib/og-image'
import { createPublicClient } from '@/lib/supabase/public'
import { formatCurrency } from '@/lib/utils'
import { isUuid } from '@/lib/validation'
import { isLocale } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'
import { cachedTitles } from '@/lib/content-translation'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Uppdrag på Prolink'

// Läses med den publika klienten, så privata förfrågningar (som RLS döljer
// för utomstående) får den generiska bilden och avslöjar ingenting.
export default async function Image({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params
  const locale = isLocale(lang) ? lang : 'sv'
  const t = createT(locale, messagesFor(locale))
  const { data } = isUuid(id)
    ? await createPublicClient()
        .from('jobs')
        .select('title, category, budget, location, status')
        .eq('id', id)
        .maybeSingle()
    : { data: null }
  if (!data) return renderOgImage({ eyebrow: t('Uppdrag'), title: t('Hitta frilansuppdrag på Prolink'), locale })

  const facts = [
    data.budget ? `${t('Budget')} ${formatCurrency(data.budget, locale)}` : t('Öppen budget'),
    data.location,
    data.status === 'open' ? t('Öppet för offerter') : t('Stängt'),
  ].filter(Boolean).join(' · ')
  return renderOgImage({
    eyebrow: `${t('Uppdrag')} · ${getCategoryLabel(data.category, t)}`,
    title: (await cachedTitles('job', [id], locale)).get(id) ?? data.title,
    detail: facts,
    locale,
  })
}
