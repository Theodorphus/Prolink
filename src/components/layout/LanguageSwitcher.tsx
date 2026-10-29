'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from '@/i18n/client'
import { splitLocale } from '@/i18n/config'

/**
 * Byter språk genom att gå till samma sida på det andra språket. Länken är en
 * vanlig <a> så att hela sidan laddas om och proxyn hinner spara valet i
 * cookien. /sv/... skickas av proxyn vidare till adressen utan prefix.
 */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale()
  const { path } = splitLocale(usePathname())
  const target = locale === 'sv' ? 'en' : 'sv'
  const href = target === 'sv' ? `/sv${path === '/' ? '' : path}` : `/en${path === '/' ? '' : path}`

  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      className={className}
    >
      {locale === 'sv' ? 'English' : 'Svenska'}
    </a>
  )
}
