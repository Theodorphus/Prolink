'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLink {
  href: string
  label: string
}

export default function MobileMenu({
  links,
  isAuthed,
}: {
  links: NavLink[]
  isAuthed: boolean
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const close = () => setOpen(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Stäng meny' : 'Öppna meny'}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-16 z-40 bg-black/20" onClick={close} />
          <nav className="absolute inset-x-0 top-16 z-50 border-b border-gray-100 bg-white shadow-lg">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={`block rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                    pathname === href ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
              {!isAuthed && (
                <Link
                  href="/register"
                  onClick={close}
                  className="mt-2 block rounded-lg bg-gray-900 px-3 py-3 text-center text-base font-medium text-white hover:bg-gray-700"
                >
                  Kom igång
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
