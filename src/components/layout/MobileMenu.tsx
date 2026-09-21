'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

interface NavLink {
  href: string
  label: string
}

interface MobileUser {
  id: string
  name: string
}

function Menu({
  links,
  user,
}: {
  links: NavLink[]
  user: MobileUser | null
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  const close = () => setOpen(false)



  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const background = [...document.querySelectorAll<HTMLElement>('main, footer')]
    const inertBefore = background.map(element => element.inert)
    background.forEach(element => { element.inert = true })
    root.current?.querySelector<HTMLElement>('nav a, nav button')?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false) }
      if (event.key === 'Tab') {
        const items = [...(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? [])]
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      background.forEach((element, index) => { element.inert = inertBefore[index] })
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  return (
    <div ref={root} className="md:hidden">
      <button ref={toggle}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Stäng meny' : 'Öppna meny'}
        aria-expanded={open}
        aria-controls="mobil-meny"
        className="relative z-[70] flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 active:bg-gray-100"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Slide-down panel */}
      {/* Panelen tas inte ur DOM när den stängs, utan skjuts utanför bild.
          Utan inert och aria-hidden går det därför att tabba in i en osynlig
          meny, och skärmläsare läser upp länkar som inte syns. */}
      <nav
        id="mobil-meny"
        aria-label="Huvudmeny"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-x-0 top-0 z-[65] origin-top bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
          <span className="text-lg font-bold tracking-tight text-gray-900">Meny</span>
        </div>

        <div className="px-4 py-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={`block rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
                pathname === href ? 'bg-blue-50 text-blue-600' : 'text-gray-800 active:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="my-3 h-px bg-gray-100" />

          {user ? (
            <>
              <Link
                href={`/profile/${user.id}`}
                onClick={close}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-semibold text-gray-800 active:bg-gray-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                  {user.name?.[0]?.toUpperCase() || 'P'}
                </span>
                {user.name?.split(' ')[0] || 'Profil'}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-xl px-4 py-3.5 text-left text-base font-semibold text-gray-500 active:bg-gray-100"
                >
                  Logga ut
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={close}
                className="block rounded-xl px-4 py-3.5 text-base font-semibold text-gray-800 active:bg-gray-100"
              >
                Logga in
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="mt-2 block rounded-xl bg-gray-900 px-4 py-3.5 text-center text-base font-semibold text-white active:bg-gray-700"
              >
                Kom igång
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}

export default function MobileMenu(props: { links: NavLink[]; user: MobileUser | null }) {
  const pathname = usePathname()
  return <Menu key={pathname} {...props} />
}
