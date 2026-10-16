import type { Locale } from '@/i18n/config'
import { msg } from '@/i18n/msg.mjs'

// Texterna skrivs på svenska direkt i koden: t('Hoppa till innehållet').
// Den svenska texten är själva nyckeln. Engelska hämtas ur src/i18n/en och
// en saknad översättning faller tillbaka på svenskan i stället för att krascha.
// Testet tests/i18n.test.mjs ser till att ingen nyckel saknas.
export type Vars = Record<string, string | number>
export type TFunction = (text: string, vars?: Vars) => string

export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

// Valideringsmeddelandena byggs ihop av en etikett och en fast mening, t.ex.
// "Titel måste vara minst 3 tecken." Mallarna ligger i ordlistan och etiketten
// översätts för sig, så att hela meddelandet går att översätta.
const PATTERNS: { regex: RegExp; key: string; names: string[] }[] = [
  { regex: /^(.+) krävs\.$/, key: msg('{label} krävs.'), names: ['label'] },
  { regex: /^(.+) måste vara minst (\d+) tecken\.$/, key: msg('{label} måste vara minst {count} tecken.'), names: ['label', 'count'] },
  { regex: /^(.+) får vara max (\d+) tecken\.$/, key: msg('{label} får vara max {count} tecken.'), names: ['label', 'count'] },
  { regex: /^(.+) har ogiltigt format\.$/, key: msg('{label} har ogiltigt format.'), names: ['label'] },
  { regex: /^(.+) måste vara ett positivt belopp\.$/, key: msg('{label} måste vara ett positivt belopp.'), names: ['label'] },
  { regex: /^(.+) är ogiltig\.$/, key: msg('{label} är ogiltig.'), names: ['label'] },
  { regex: /^(.+) är ogiltigt\.$/, key: msg('{label} är ogiltigt.'), names: ['label'] },
  { regex: /^(.+) måste vara en giltig http- eller https-adress\.$/, key: msg('{label} måste vara en giltig http- eller https-adress.'), names: ['label'] },
]

function translateDynamic(text: string, messages: Record<string, string>): string | undefined {
  for (const pattern of PATTERNS) {
    const match = text.match(pattern.regex)
    const template = messages[pattern.key]
    if (!match || !template) continue
    const vars: Vars = {}
    pattern.names.forEach((name, index) => {
      const value = match[index + 1]
      vars[name] = name === 'label' ? (messages[value] ?? value) : value
    })
    return interpolate(template, vars)
  }
  return undefined
}

export function createT(locale: Locale, messages: Record<string, string>): TFunction {
  // Servrar och anrop kan ge undefined (t.ex. ett felsvar utan text). Det ska
  // passera orört i stället för att krascha renderingen.
  return (text, vars) => (typeof text === 'string' ? interpolate(locale === 'sv' ? text : (messages[text] ?? translateDynamic(text, messages) ?? text), vars) : text)
}

export { msg }
