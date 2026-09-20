export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="skeleton mb-6 h-8 w-48 rounded-lg" />
      <div className="space-y-2" role="status" aria-live="polite" aria-label="Laddar konversationer">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-2xl border border-line-soft p-4">
            <div className="skeleton h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton mt-2 h-3 w-24 rounded" />
              <div className="skeleton mt-2 h-4 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
