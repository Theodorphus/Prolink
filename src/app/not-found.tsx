import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sidan hittades inte',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">404</p>
      <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Sidan hittades inte
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Länken kan vara felstavad, eller så har uppdraget eller tjänsten tagits bort.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/jobs"
          className="rounded-xl bg-[var(--accent-strong)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--accent-deep)]"
        >
          Bläddra bland uppdrag
        </Link>
        <Link
          href="/services"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Se tjänster
        </Link>
        <Link href="/" className="px-2 py-3 text-sm font-semibold text-slate-500 underline-offset-4 hover:underline">
          Till startsidan
        </Link>
      </div>
    </div>
  )
}
