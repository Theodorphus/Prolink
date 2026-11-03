'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Script from 'next/script'
import Link from '@/components/i18n/Link'
import { useT } from '@/i18n/client'
import {
  GOOGLE_ADS_ID, OPEN_SETTINGS_EVENT, adsEnabled, readConsent, storeConsent, subscribeConsent,
  type ConsentChoice,
} from '@/lib/consent'

// Google Consent Mode v2: allt nekas från start. Taggen laddas först efter
// ett godkännande, så inga anrop till Google görs innan dess.
const CONSENT_DEFAULT = `window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});`

export default function ConsentBanner() {
  const t = useT()
  // På servern är valet okänt ('pending'), så rutan visas först i webbläsaren.
  const choice = useSyncExternalStore(subscribeConsent, readConsent, () => 'pending' as const)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const open = choice === null || settingsOpen

  useEffect(() => {
    const onOpen = () => setSettingsOpen(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen)
  }, [])

  // Återkallat samtycke gäller direkt: taggen sägs upp och Googles cookies rensas.
  useEffect(() => {
    if (choice !== 'denied' || typeof window.gtag !== 'function') return
    window.gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' })
    for (const name of document.cookie.split(';').map(part => part.split('=')[0].trim())) {
      if (name.startsWith('_ga') || name === '_gcl_au' || name.startsWith('_gcl_')) {
        document.cookie = `${name}=; Max-Age=0; path=/`
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname.replace(/^www\./, '')}`
      }
    }
  }, [choice])

  if (!adsEnabled()) return null

  const decide = (value: ConsentChoice) => {
    storeConsent(value)
    setSettingsOpen(false)
  }

  return (
    <>
      <Script id="consent-default" strategy="afterInteractive">{CONSENT_DEFAULT}</Script>
      {choice === 'granted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
          <Script id="google-ads-config" strategy="afterInteractive">
            {`gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'denied'});gtag('js',new Date());gtag('config','${GOOGLE_ADS_ID}');`}
          </Script>
        </>
      )}
      {open && (
        // Kompakt: annonsklick landar oftast på mobil, och en hög ruta täckte
        // hjältens knappar. Båda valen är lika stora och lika nära till hands.
        <div role="dialog" aria-label={t('Cookies för annonsmätning')} className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:flex-row sm:items-center sm:gap-5">
            <p className="text-[13px] leading-5 text-slate-600 sm:flex-1">
              {t('Vi använder cookies från Google Ads för att mäta våra annonser. Nödvändiga cookies används alltid.')}{' '}
              <Link href="/privacy" className="font-medium text-blue-700 underline">{t('Läs mer')}</Link>
            </p>
            <div className="flex gap-2 sm:shrink-0">
              <button type="button" onClick={() => decide('denied')} className="flex-1 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 sm:flex-none">
                {t('Neka')}
              </button>
              <button type="button" onClick={() => decide('granted')} className="flex-1 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 sm:flex-none">
                {t('Godkänn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
