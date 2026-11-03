// Samtycke till annonscookies. Google-taggen laddas först när besökaren har
// godkänt, och aldrig utan ett tagg-ID i miljön. Valet sparas i webbläsaren
// och styr bara annonsmätningen; nödvändiga cookies påverkas inte.
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || ''

// Konverteringsetiketten är delen efter snedstrecket i 'AW-123/etikett'.
// Utan etikett mäts ingen konvertering, men taggen fungerar ändå.
const CONVERSION_LABELS = {
  signup: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_SIGNUP?.trim() || '',
  job: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL_JOB?.trim() || '',
} as const

export type ConversionName = keyof typeof CONVERSION_LABELS
export type ConsentChoice = 'granted' | 'denied'

const STORAGE_KEY = 'prolink_ads_consent'
export const CONSENT_EVENT = 'prolink:consent'
export const OPEN_SETTINGS_EVENT = 'prolink:consent-settings'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function adsEnabled(): boolean {
  return GOOGLE_ADS_ID.length > 0
}

// Valet hålls också i minnet, så att rutan stängs även när webbläsaren inte
// tillåter lagring. Då frågar vi igen vid nästa besök.
let sessionChoice: ConsentChoice | null = null

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : sessionChoice
  } catch {
    return sessionChoice
  }
}

export function storeConsent(choice: ConsentChoice) {
  sessionChoice = choice
  try {
    window.localStorage.setItem(STORAGE_KEY, choice)
  } catch {}
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

/** För useSyncExternalStore: valet kan ändras här eller i en annan flik. */
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))
}

/** Skickar en konvertering till Google Ads, bara om besökaren har godkänt. */
export function trackConversion(name: ConversionName) {
  const label = CONVERSION_LABELS[name]
  if (!adsEnabled() || !label || readConsent() !== 'granted' || typeof window.gtag !== 'function') return
  window.gtag('event', 'conversion', { send_to: `${GOOGLE_ADS_ID}/${label}` })
}
