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
        <div role="dialog" aria-labelledby="cookie-rubrik" className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:p-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 id="cookie-rubrik" className="text-sm font-bold text-slate-900">{t('Cookies för annonsmätning')}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {t('Vi använder Google Ads för att mäta vilka annonser som leder till nya användare. Det kräver cookies som du får välja bort. Nödvändiga cookies för inloggning och språk används alltid.')}{' '}
              <Link href="/privacy" className="font-medium text-blue-700 underline">{t('Läs mer i integritetspolicyn')}</Link>
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => decide('granted')} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
                {t('Godkänn')}
              </button>
              <button type="button" onClick={() => decide('denied')} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50">
                {t('Neka')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
