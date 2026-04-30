import Link from 'next/link'
import Image from 'next/image'
import StarRating from '@/components/reviews/StarRating'
import { formatDate } from '@/lib/utils'
import type { ReviewWithReviewer } from '@/types/database'

export default function ReviewCard({ review }: { review: ReviewWithReviewer }) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${review.reviewer.id}`} className="shrink-0">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 text-sm overflow-hidden">
            {review.reviewer.avatar_url ? (
              <Image src={review.reviewer.avatar_url} alt={review.reviewer.name} width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              review.reviewer.name?.[0]?.toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Link href={`/profile/${review.reviewer.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
              {review.reviewer.name}
            </Link>
            <span className="text-xs text-gray-400 shrink-0">{formatDate(review.created_at)}</span>
          </div>
          <StarRating value={review.rating} readonly size="sm" />
          {review.comment && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  )
}
