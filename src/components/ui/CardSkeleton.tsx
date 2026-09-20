// Delad laddningsplatshållare. Använder samma .skeleton-klass som
// startsidans LatestJobs, så att väntan ser likadan ut i hela produkten.
export function CardSkeleton() {
  return (
    <div className="rounded-panel border border-line-soft bg-surface-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="skeleton h-11 w-11 rounded-xl" />
        <div className="skeleton h-7 w-24 rounded-full" />
      </div>
      <div className="skeleton mt-6 h-3 w-24 rounded" />
      <div className="skeleton mt-3 h-5 w-full rounded" />
      <div className="skeleton mt-2 h-5 w-3/4 rounded" />
      <div className="skeleton mt-5 h-3 w-32 rounded" />
    </div>
  )
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      // Skärmläsare ska höra att innehåll laddas, inte tomma rutor.
      role="status"
      aria-live="polite"
      aria-label="Laddar innehåll"
    >
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}
