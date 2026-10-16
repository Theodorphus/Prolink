import { lang } from 'next/root-params'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from '@/i18n/config'
import { createT, type TFunction } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'

/** Språket för den aktuella sidan. Fungerar i serverkomponenter och layouter. */
export async function getLocale(): Promise<Locale> {
  const value = await lang()
  if (!isLocale(value)) notFound()
  return value
}

export async function getT(): Promise<TFunction> {
  const locale = await getLocale()
  return createT(locale, messagesFor(locale))
}

/**
 * Språket i route handlers och server actions, där next/root-params inte går
 * att använda. Proxyn sätter cookien på varje sida som besöks.
 */
export async function getRequestLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export async function getRequestT(): Promise<TFunction> {
  const locale = await getRequestLocale()
  return createT(locale, messagesFor(locale))
}
