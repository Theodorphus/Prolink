'use client'

import { usePathname } from 'next/navigation'
import { splitLocale } from '@/i18n/config'

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const isHome = splitLocale(usePathname()).path === '/'

  return (
    <div
      data-transparent={isHome ? 'true' : undefined}
      className={isHome ? 'absolute inset-x-0 top-0 z-50' : 'sticky top-0 z-50'}
    >
      {children}
    </div>
  )
}
