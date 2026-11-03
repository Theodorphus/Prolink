import type { createClient } from './client'

type BrowserClient = ReturnType<typeof createClient>

// Supabase-klienten är runt 250 kB JavaScript. Navigeringen finns på varje sida
// men behöver bara klienten för inloggade, så den laddas först när den behövs i
// stället för att följa med i varje besökares första nedladdning.
let client: Promise<BrowserClient> | undefined

export function lazyClient(): Promise<BrowserClient> {
  return client ??= import('./client').then(module => module.createClient())
}

/**
 * Om webbläsaren har en Supabase-session. Sessionscookien (sb-<projekt>-auth-token,
 * ibland uppdelad i .0, .1) är läsbar från JavaScript, eftersom webbläsarklienten
 * själv läser den därifrån. Saknas den är besökaren utloggad.
 */
export function hasSessionCookie(): boolean {
  return /(?:^|;\s*)sb-[^=;]+-auth-token/.test(document.cookie)
}
