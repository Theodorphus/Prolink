'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { splitLocale } from '@/i18n/config'

// Så långt ner kan man scrolla innan navigeringen går från genomskinlig över
// hjälten till den vanliga vita varianten. Ungefär headerns egen höjd.
const SOLID_AFTER = 48

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const isHome = splitLocale(usePathname()).path === '/'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) return
    const update = () => setScrolled(window.scrollY > SOLID_AFTER)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [isHome])

  // På startsidan ligger navigeringen över hjälten (fixed i stället för
  // sticky, så att den inte tar plats ovanför den). Tidigare var den absolute
  // och försvann när man scrollade, till skillnad från alla andra sidor.
  return (
    <div
      data-transparent={isHome && !scrolled ? 'true' : undefined}
      className={isHome ? 'fixed inset-x-0 top-0 z-50' : 'sticky top-0 z-50'}
    >
      {children}
    </div>
  )
}
