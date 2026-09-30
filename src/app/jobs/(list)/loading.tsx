import { CardListSkeleton } from '@/components/ui/CardSkeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="skeleton mb-8 h-10 w-56 rounded-lg" />
      <CardListSkeleton count={6} />
    </div>
  )
}
