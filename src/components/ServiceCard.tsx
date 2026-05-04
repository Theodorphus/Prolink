import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Service, User } from '@/types/database'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-neutral-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function ServiceThumbnail({ title }: { title: string }) {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-600',
    'from-pink-500 to-fuchsia-600',
    'from-indigo-500 to-blue-600',
  ]
  const index = title.charCodeAt(0) % colors.length
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className={`w-full h-28 rounded-xl bg-gradient-to-br ${colors[index]} flex items-center justify-center shadow-inner`}>
      <span className="text-3xl font-black text-white/80 tracking-tight">{initials}</span>
    </div>
  )
}

export interface ServiceCardService extends Service {
  provider: Pick<User, 'name' | 'avatar_url'>
  rating?: number
  review_count?: number
}

interface ServiceCardProps {
  service: ServiceCardService
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const rating = service.rating ?? 0
  const reviewCount = service.review_count ?? 0
  const hasRating = reviewCount > 0

  return (
    <Link href={`/services/${service.id}`} className="group block h-full">
      <article className="bg-white border border-neutral-200 rounded-2xl overflow-hidden h-full flex flex-col hover:shadow-lg hover:-translate-y-1 hover:border-neutral-300 transition-all duration-200">

        {/* Thumbnail */}
        <div className="p-4 pb-0">
          <ServiceThumbnail title={service.title} />
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Title */}
          <h3 className="text-base font-bold text-neutral-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2 flex-1">
            {service.description}
          </p>

          {/* Rating + delivery */}
          <div className="flex items-center gap-3 flex-wrap">
            {hasRating ? (
              <div className="flex items-center gap-1.5">
                <StarRating rating={rating} />
                <span className="text-xs font-bold text-neutral-700">{rating.toFixed(1)}</span>
                <span className="text-[11px] text-neutral-400">({reviewCount})</span>
              </div>
            ) : (
              <span className="text-[11px] text-neutral-400 italic">Inga omdömen än</span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full ml-auto">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {service.delivery_time}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-100 pt-3 flex items-center justify-between gap-2">
            {/* Provider */}
            <div className="flex items-center gap-2 min-w-0">
              {service.provider?.avatar_url ? (
                <img
                  src={service.provider.avatar_url}
                  alt={service.provider.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {service.provider?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="text-xs font-medium text-neutral-600 truncate max-w-[100px]">
                {service.provider?.name ?? 'Anonym'}
              </span>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-[10px] text-neutral-400 font-medium leading-none mb-0.5">från</p>
                <span className="text-sm font-bold text-neutral-900">{formatCurrency(service.price)}</span>
              </div>
              <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-1 transition-colors">
                Visa tjänst
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
