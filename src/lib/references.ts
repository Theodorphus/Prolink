import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

// Token i referenslänken är 32 slumpade byte i base64url (43 tecken). Bara
// hashen sparas i tabellen; själva länken finns bara i mejlkön.
export function createReferenceToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: createHash('sha256').update(token).digest('hex') }
}

export function referenceTokenHash(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  return createHash('sha256').update(token).digest('hex')
}

export function referenceExpired(expiresAt: string) {
  return Date.parse(expiresAt) < Date.now()
}
