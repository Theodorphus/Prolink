import { getCategoryLabel } from '@/lib/categories'
import { OG_SIZE, renderOgImage } from '@/lib/og-image'
import { createPublicClient } from '@/lib/supabase/public'
import { formatCurrency } from '@/lib/utils'
import { isUuid } from '@/lib/validation'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Tjänst på Prolink'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = isUuid(id)
    ? await createPublicClient()
        .from('services')
        .select('title, price, delivery_time, category, provider:users(name)')
        .eq('id', id)
        .maybeSingle()
    : { data: null }
  if (!data) return renderOgImage({ eyebrow: 'Tjänster', title: 'Hitta rätt frilansare för ditt företag' })

  const provider = Array.isArray(data.provider) ? data.provider[0] : data.provider
  return renderOgImage({
    eyebrow: getCategoryLabel(data.category),
    title: data.title,
    detail: `Från ${formatCurrency(data.price)} · ${data.delivery_time}${provider?.name ? ` · ${provider.name}` : ''}`,
  })
}
