import 'server-only'

import type { Locale } from '@/i18n/config'
import { en, enClient } from '@/i18n/en'

/** Ordlistan för ett språk. Svenska är nyckeln och behöver ingen lista. */
export function messagesFor(locale: Locale): Record<string, string> {
  return locale === 'en' ? en : {}
}

/**
 * Det som skickas till webbläsaren. Löptexten i FAQ, villkor och policy
 * renderas bara på servern och skulle annars följa med i varje sida i onödan.
 */
export function clientMessagesFor(locale: Locale): Record<string, string> {
  return locale === 'en' ? enClient : {}
}
