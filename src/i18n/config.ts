// Språkstöd. Svenska är standardspråket och ligger på de adresser som redan
// fanns (/jobs, /services ...). Engelska ligger under /en. Proxyn skriver om
// svenska adresser internt till /sv/... så att alla sidor kan ligga under
// app/[lang], men prefixet /sv syns aldrig utåt.
export const LOCALES = ['sv', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'sv'

/** Cookie som minns valt språk, så att länkar utan prefix hamnar rätt. */
export const LOCALE_COOKIE = 'lang'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Språkkod för <html lang>. */
export function htmlLang(locale: Locale): string {
  return locale === 'en' ? 'en' : 'sv'
}

/** Språkkod för Intl-formatering (datum, valuta). */
export function intlLocale(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : 'sv-SE'
}

/** Språkkod för og:locale. */
export function ogLocale(locale: Locale): string {
  return locale === 'en' ? 'en_GB' : 'sv_SE'
}

function isInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//')
}

/**
 * Gör en intern sökväg språkriktig. Svenska adresser lämnas orörda, engelska
 * får prefixet /en. Externa adresser, ankare och mailto-länkar rörs inte.
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !isInternalPath(path)) return path
  if (path === '/en' || path.startsWith('/en/') || path.startsWith('/en?') || path.startsWith('/en#')) return path
  if (path === '/') return '/en'
  if (path.startsWith('/?') || path.startsWith('/#')) return `/en${path.slice(1)}`
  return `/en${path}`
}

/** Delar upp en adress i språk och sökväg utan språkprefix. */
export function splitLocale(pathname: string): { locale: Locale; path: string; prefixed: boolean } {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) return { locale, path: '/', prefixed: true }
    if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1), prefixed: true }
  }
  return { locale: DEFAULT_LOCALE, path: pathname, prefixed: false }
}
