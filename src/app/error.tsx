'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Utan den här filen visades Next.js generiska kraschsida vid oväntade fel.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Ohanterat fel i renderingen:', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Något gick fel</p>
      <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Sidan kunde inte visas
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Felet är tillfälligt i de flesta fall. Försök igen, eller gå tillbaka till startsidan.
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-slate-400">Referens: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[var(--accent-strong)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--accent-deep)]"
        >
          Försök igen
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Till startsidan
        </Link>
      </div>
    </div>
  )
}
