import { getCategoryLabel } from '@/lib/categories'
import { getCategoryContent } from '@/lib/category-content'
import { OG_SIZE, renderOgImage } from '@/lib/og-image'
import { isLocale } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Kategori på Prolink'

export default async function Image({ params }: { params: Promise<{ lang: string; kategori: string }> }) {
  const { lang, kategori } = await params
  const locale = isLocale(lang) ? lang : 'sv'
  const t = createT(locale, messagesFor(locale))
  const content = getCategoryContent(kategori, locale)
  return renderOgImage({
    eyebrow: getCategoryLabel(kategori, t),
    title: content?.heading ?? t('Hitta rätt frilansare för ditt företag'),
    detail: t('Jämför offerter – kostnadsfritt att publicera uppdrag'),
    locale,
  })
}
