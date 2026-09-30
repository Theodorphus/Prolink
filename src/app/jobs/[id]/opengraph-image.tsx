import { getCategoryLabel } from '@/lib/categories'
import { OG_SIZE, renderOgImage } from '@/lib/og-image'
import { createPublicClient } from '@/lib/supabase/public'
import { formatCurrency } from '@/lib/utils'
import { isUuid } from '@/lib/validation'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Uppdrag på Prolink'

// Läses med den publika klienten, så privata förfrågningar (som RLS döljer
// för utomstående) får den generiska bilden och avslöjar ingenting.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = isUuid(id)
    ? await createPublicClient()
        .from('jobs')
        .select('title, category, budget, location, status')
        .eq('id', id)
        .maybeSingle()
    : { data: null }
  if (!data) return renderOgImage({ eyebrow: 'Uppdrag', title: 'Hitta frilansuppdrag på Prolink' })

  const facts = [
    data.budget ? `Budget ${formatCurrency(data.budget)}` : 'Öppen budget',
    data.location,
    data.status === 'open' ? 'Öppet för offerter' : 'Stängt',
  ].filter(Boolean).join(' · ')
  return renderOgImage({
    eyebrow: `Uppdrag · ${getCategoryLabel(data.category)}`,
    title: data.title,
    detail: facts,
  })
}
