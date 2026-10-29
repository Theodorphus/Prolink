import Link from '@/components/i18n/Link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/categories'
import { getLocale, getT } from '@/i18n/server'

export interface ServiceCardService {
  id: string
  title: string
  description: string
  price: number
  delivery_time: string
  category: string | null
  provider?: {
    id?: string
    name: string
    avatar_url?: string | null
    verified?: boolean
    reference_count?: number
    review_count?: number
    average_rating?: number | null
  } | null
}

/**
 * Gemensamt tjänstekort. Används i tjänstelistan och på profilsidan så att
 * kategori, pris och leveranstid presenteras likadant.
 *
 * Priset märks som "från" eftersom databasen bara har ett enda prisfält och
 * inte kan uttrycka vad som ingår. Att kalla det fast pris vore att lova mer
 * än vad datamodellen bär.
 */
export default async function ServiceCard({
  service,
  showProvider = true,
  headingLevel = 3,
}: {
  service: ServiceCardService
  showProvider?: boolean
  headingLevel?: 2 | 3
}) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  const locale = await getLocale()
  const t = await getT()
  return (
    <Link href={`/services/${service.id}`} className="group block h-full">
      <article className="surface surface-interactive flex h-full flex-col gap-3 p-6">
        {service.category && (
          <span className="self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
            {getCategoryLabel(service.category, t)}
          </span>
        )}

        <Heading className="line-clamp-2 text-base font-bold leading-snug tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
          {service.title}
        </Heading>

        <p className="line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>

        {showProvider && service.provider && (
          <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3.5">
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {service.provider.avatar_url ? (
                <Image
                  src={service.provider.avatar_url}
                  alt={service.provider.name}
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                service.provider.name?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-600">
                {service.provider.name}
                {!!service.provider.review_count && service.provider.average_rating != null && (
                  <span className="ml-1.5 font-semibold text-slate-800">
                    <span aria-hidden="true">★</span> {service.provider.average_rating.toLocaleString(locale, { minimumFractionDigits: 1 })} ({service.provider.review_count})
                    <span className="sr-only">{t('i betyg')}</span>
                  </span>
                )}
              </p>
              {(service.provider.verified || !!service.provider.reference_count) && (
                <p className="truncate text-xs font-semibold text-emerald-700">
                  {[
                    service.provider.verified && t('✓ Verifierat företag'),
                    !!service.provider.reference_count &&
                      `${service.provider.reference_count} ${service.provider.reference_count === 1 ? t('referens') : t('referenser')}`,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-black tracking-[-0.02em] text-slate-900">
              {formatCurrency(service.price, locale)}
            </p>
            <p className="text-xs font-medium text-slate-500">{t('från')}</p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
            {service.delivery_time}
          </span>
        </div>
      </article>
    </Link>
  )
}
