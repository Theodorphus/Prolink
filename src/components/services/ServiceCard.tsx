import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/categories'

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
export default function ServiceCard({
  service,
  showProvider = true,
}: {
  service: ServiceCardService
  showProvider?: boolean
}) {
  return (
    <Link href={`/services/${service.id}`} className="group block h-full">
      <article className="surface surface-interactive flex h-full flex-col gap-3 p-6">
        {service.category && (
          <span className="self-start rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
            {getCategoryLabel(service.category)}
          </span>
        )}

        <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-blue-700">
          {service.title}
        </h3>

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
            <span className="flex-1 truncate text-xs font-medium text-slate-600">
              {service.provider.name}
            </span>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-black tracking-[-0.02em] text-slate-900">
              {formatCurrency(service.price)}
            </p>
            <p className="text-xs font-medium text-slate-400">från</p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
            {service.delivery_time}
          </span>
        </div>
      </article>
    </Link>
  )
}
