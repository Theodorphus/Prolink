'use client'

import { createContext, useContext, useMemo } from 'react'
import { DEFAULT_LOCALE, localePath, type Locale } from '@/i18n/config'
import { createT, type TFunction } from '@/i18n/translate'

interface LocaleValue {
  locale: Locale
  t: TFunction
}

const LocaleContext = createContext<LocaleValue>({ locale: DEFAULT_LOCALE, t: createT(DEFAULT_LOCALE, {}) })

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: Record<string, string>
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ locale, t: createT(locale, messages) }), [locale, messages])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale
}

export function useT(): TFunction {
  return useContext(LocaleContext).t
}

/** Gör en intern adress språkriktig, för router.push och liknande. */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale()
  return (path: string) => localePath(locale, path)
}
