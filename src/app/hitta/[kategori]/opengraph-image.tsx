import { getCategoryLabel } from '@/lib/categories'
import { getCategoryContent } from '@/lib/category-content'
import { OG_SIZE, renderOgImage } from '@/lib/og-image'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Kategori på Prolink'

export default async function Image({ params }: { params: Promise<{ kategori: string }> }) {
  const { kategori } = await params
  const content = getCategoryContent(kategori)
  return renderOgImage({
    eyebrow: getCategoryLabel(kategori),
    title: content?.heading ?? 'Hitta rätt frilansare för ditt företag',
    detail: 'Jämför offerter – kostnadsfritt att publicera uppdrag',
  })
}
