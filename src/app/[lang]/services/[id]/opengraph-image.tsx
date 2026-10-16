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
export const alt = 'Tjänst på Prolink'

export default async function Image({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params
  const locale = isLocale(lang) ? lang : 'sv'
  const t = createT(locale, messagesFor(locale))
  const { data } = isUuid(id)
    ? await createPublicClient()
        .from('services')
        .select('title, price, delivery_time, category, provider:users(name)')
        .eq('id', id)
        .maybeSingle()
    : { data: null }
  if (!data) return renderOgImage({ eyebrow: t('Tjänster'), title: t('Hitta rätt frilansare för ditt företag'), locale })

  const provider = Array.isArray(data.provider) ? data.provider[0] : data.provider
  return renderOgImage({
    eyebrow: getCategoryLabel(data.category, t),
    title: (await cachedTitles('service', [id], locale)).get(id) ?? data.title,
    detail: `${t('Från')} ${formatCurrency(data.price, locale)} · ${data.delivery_time}${provider?.name ? ` · ${provider.name}` : ''}`,
    locale,
  })
}
