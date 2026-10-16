// Regler för förtroendesignaler på profilen. Rena funktioner utan beroenden,
// så att de går att testa med node --test.

// Organisationsnummer (och personnummer för enskild firma) har tio siffror där
// den sista är en kontrollsiffra enligt Luhn. Tolv siffror med sekel (16, 19
// eller 20) och bindestreck godtas och normaliseras bort.
import { msg } from '../i18n/msg.mjs'

export function normalizeOrgNumber(value) {
  const digits = String(value ?? '').replace(/[\s-]/g, '')
  if (!/^\d+$/.test(digits)) return null
  const ten = digits.length === 12 && /^(16|19|20)/.test(digits) ? digits.slice(2) : digits
  if (ten.length !== 10) return null
  let sum = 0
  for (let index = 0; index < 10; index++) {
    let digit = Number(ten[index]) * (index % 2 === 0 ? 2 : 1)
    if (digit > 9) digit -= 9
    sum += digit
  }
  return sum % 10 === 0 ? ten : null
}

export function formatOrgNumber(value) {
  return `${value.slice(0, 6)}-${value.slice(6)}`
}

// Adresser hos de vanliga e-posttjänsterna delas av miljontals människor, så
// samma domän säger inget om att det är samma person.
const SHARED_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.se', 'outlook.com', 'outlook.se', 'live.com', 'live.se',
  'msn.com', 'yahoo.com', 'yahoo.se', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
  'telia.com', 'bredband.net', 'spray.se', 'comhem.se', 'tele2.se', 'gmx.com', 'gmx.se', 'aol.com',
])

// Varför en referensförfrågan till adressen inte får skickas, eller null.
// Den egna adressen och den egna företagsdomänen skulle låta frilansaren
// skriva sina egna omdömen.
export function referenceEmailProblem(clientEmail, providerEmail) {
  const client = String(clientEmail ?? '').trim().toLowerCase()
  const own = String(providerEmail ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client)) return msg('Ange en giltig e-postadress.')
  if (client === own) return msg('Du kan inte be dig själv om en referens.')
  const domain = client.split('@')[1]
  if (own && domain === own.split('@')[1] && !SHARED_DOMAINS.has(domain)) {
    return msg('Adressen har samma domän som din egen. Be om referenser från kunder, inte kollegor.')
  }
  return null
}

// En webbadress utan protokoll ("noemo.se") är så de flesta skriver den.
export function normalizeWebsite(value) {
  const text = String(value ?? '').trim()
  if (!text) return null
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(candidate)
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname.includes('.')) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

export function websiteLabel(value) {
  try {
    const url = new URL(value)
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')
    return url.hostname.replace(/^www\./, '') + path
  } catch {
    return value
  }
}

// Det som gör en frilansprofil trovärdig, i den ordning det väger tyngst.
// Varje steg har en länk till var på profilen det fixas.
const PROFILE_STEPS = [
  { key: 'avatar', label: msg('Lägg till en profilbild'), done: p => Boolean(p.avatar_url), anchor: '#redigera' },
  { key: 'bio', label: msg('Beskriv dig själv med minst 150 tecken'), done: p => (p.bio ?? '').trim().length >= 150, anchor: '#redigera' },
  { key: 'service', label: msg('Publicera en tjänst'), done: p => p.services > 0, anchor: '/services/create' },
  { key: 'portfolio', label: msg('Visa ett tidigare arbete i portfolion'), done: p => p.portfolio > 0, anchor: '#portfolio' },
  { key: 'skills', label: msg('Ange minst tre kompetenser'), done: p => (p.skills ?? []).length >= 3, anchor: '#redigera' },
  { key: 'location', label: msg('Ange ort och arbetssätt'), done: p => Boolean(p.location && p.work_mode), anchor: '#redigera' },
  { key: 'link', label: msg('Länka hemsida eller LinkedIn'), done: p => Boolean(p.website_url || p.linkedin_url), anchor: '#redigera' },
  { key: 'company', label: msg('Verifiera ditt företag'), done: p => Boolean(p.companySubmitted), anchor: '#fortroende' },
  { key: 'reference', label: msg('Be en tidigare kund om en referens'), done: p => p.referencesRequested > 0, anchor: '#fortroende' },
]

export function profileCompleteness(profile) {
  const missing = PROFILE_STEPS.filter(step => !step.done(profile)).map(({ key, label, anchor }) => ({ key, label, anchor }))
  return { percent: Math.round(((PROFILE_STEPS.length - missing.length) / PROFILE_STEPS.length) * 100), missing }
}

// Svarstiden visas först när det finns tillräckligt underlag, och avrundas
// till grova intervall så att enstaka svar inte ger falsk precision.
export function responseTimeLabel(medianHours, samples) {
  if (medianHours == null || samples < 3) return null
  if (medianHours <= 1) return msg('Svarar oftast inom en timme')
  if (medianHours <= 4) return msg('Svarar oftast inom några timmar')
  if (medianHours <= 24) return msg('Svarar oftast inom ett dygn')
  if (medianHours <= 72) return msg('Svarar oftast inom några dagar')
  return null
}

export const WORK_MODES = { remote: msg('På distans'), onsite: msg('På plats'), hybrid: msg('På plats eller distans') }
