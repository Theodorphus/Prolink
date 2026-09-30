'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLink {
  href: string
  label: string
}

interface MobileUser {
  id: string
  name: string
}

const noSubscription = () => () => {}

function Menu({
  links,
  user,
  onSignOut,
}: {
  links: NavLink[]
  /** undefined medan inloggningsläget ännu inte är känt. */
  user: MobileUser | null | undefined
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const layer = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  // Portalen behöver document, som inte finns vid serverrenderingen.
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const previous = (document.activeElement as HTMLElement | null) ?? toggle.current
    // Allt utom menylagret görs inert, även headern med menyknappen som
    // ligger under den nedtonade bakgrunden.
    const background = [...document.body.children].filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== layer.current
    )
    const inertBefore = background.map(element => element.inert)
    background.forEach(element => { element.inert = true })
    layer.current?.querySelector<HTMLElement>('nav a, nav button')?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false) }
      if (event.key === 'Tab') {
        const items = [...(layer.current?.querySelectorAll<HTMLElement>('nav button:not(:disabled), nav a[href]') ?? [])]
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      background.forEach((element, index) => { element.inert = inertBefore[index] })
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [open])

  // Panelen och bakgrunden renderas direkt i body. Inne i headern ärvde
  // länkarna startsidans vita navigeringsfärg (vit text på vit panel), och
  // headerns backdrop-filter gjorde headern till referensram för
  // position: fixed, så bakgrunden täckte bara headerns 64 pixlar.
  const layerContent = (
    <div ref={layer} className="md:hidden">
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panelen tas inte ur DOM när den stängs, utan skjuts utanför bild.
          Utan inert och aria-hidden går det därför att tabba in i en osynlig
          meny, och skärmläsare läser upp länkar som inte syns. */}
      <nav
        id="mobil-meny"
        aria-label="Huvudmeny"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-x-0 top-0 z-[65] max-h-[100dvh] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
          <span className="text-lg font-bold tracking-tight text-gray-900">Meny</span>
          <button
            type="button"
            onClick={close}
            aria-label="Stäng meny"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 active:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

          {/* Kontodelen väntar tills inloggningsläget är känt. Panelen ligger
              precis ovanför skärmen, inom Next.js förhämtningsmarginal, så
              utloggade länkar som renderades i väntan på läget förhämtades
              även för inloggade. Proxyn omdirigerar dem från /login och
              /register till startsidan, och förhämtningen hamnade i en loop. */}
          {user === undefined ? null : user ? (
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
              <button
                type="button"
                onClick={() => { close(); onSignOut() }}
                className="w-full rounded-xl px-4 py-3.5 text-left text-base font-semibold text-gray-500 active:bg-gray-100"
              >
                Logga ut
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                prefetch={false}
                onClick={close}
                className="block rounded-xl px-4 py-3.5 text-base font-semibold text-gray-800 active:bg-gray-100"
              >
                Logga in
              </Link>
              <Link
                href="/register"
                prefetch={false}
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

  return (
    <div className="md:hidden">
      <button
        ref={toggle}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Öppna meny"
        aria-expanded={open}
        aria-controls="mobil-meny"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 active:bg-gray-100"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mounted && createPortal(layerContent, document.body)}
    </div>
  )
}

export default function MobileMenu(props: { links: NavLink[]; user: MobileUser | null | undefined; onSignOut: () => void }) {
  const pathname = usePathname()
  return <Menu key={pathname} {...props} />
}
