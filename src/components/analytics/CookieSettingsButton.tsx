'use client'

import { useT } from '@/i18n/client'
import { adsEnabled, openConsentSettings } from '@/lib/consent'

// Gör det lika enkelt att ändra sitt val som att göra det. Visas bara när
// annonsmätning är påslagen, annars finns inget att välja. Tagg-ID:t bakas in
// vid bygget, så server och webbläsare är alltid överens.
export default function CookieSettingsButton({ className }: { className?: string }) {
  const t = useT()
  if (!adsEnabled()) return null
  return <button type="button" onClick={openConsentSettings} className={className}>{t('Cookie-inställningar')}</button>
}
