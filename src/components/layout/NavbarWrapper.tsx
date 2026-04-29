'use client'

import { usePathname } from 'next/navigation'

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const isHome = usePathname() === '/'

  return (
    <div
      data-transparent={isHome ? 'true' : undefined}
      className={isHome ? 'absolute inset-x-0 top-0 z-50' : 'sticky top-0 z-50'}
    >
      {children}
    </div>
  )
}
