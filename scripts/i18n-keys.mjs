// Samlar alla texter som ska översättas. Den svenska texten är nyckeln: den
// står antingen i ett anrop t('...') / msg('...'), eller, för felmeddelanden
// som servern skickar och webbläsaren översätter, som error: '...' i API-rutter
// och server actions. Används av tests/i18n.test.mjs och av
// `node scripts/i18n-keys.mjs` som skriver ut nycklarna som saknas på engelska.
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'src')
export const DICTIONARY_DIR = path.join(SRC, 'i18n', 'en')

// Filer där felmeddelanden skrivs som error: '...' och översätts i webbläsaren.
const MESSAGE_FILES = [
  /src[\\/]app[\\/]api[\\/].*\.ts$/,
  /src[\\/]lib[\\/]actions[\\/].*\.ts$/,
  /src[\\/]lib[\\/][\w-]*-input\.ts$/,
  /src[\\/]lib[\\/]validation\.ts$/,
  /src[\\/]lib[\\/]trust\.mjs$/,
]
// Admin är medvetet bara på svenska.
const SKIP = [
  /src[\\/]app[\\/]\[lang\][\\/]admin[\\/]/,
  /src[\\/]components[\\/]admin[\\/]/,
  /src[\\/]lib[\\/]admin/,
]

function unescapeLiteral(body) {
  return body.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, ch) => {
    if (ch[0] === 'u' && ch.length === 5) return String.fromCharCode(parseInt(ch.slice(1), 16))
    if (ch === 'n') return '\n'
    if (ch === 't') return '\t'
    return ch
  })
}

const LITERAL = String.raw`(['"` + '`' + String.raw`])((?:\\.|(?!\1)[^\\\n])*)\1`
const CALL = new RegExp(String.raw`(?<![\w.$])(?:t|msg)\(\s*` + LITERAL, 'g')
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(tsx?|mjs)$/.test(entry.name) && !entry.name.endsWith('.d.mts') && !entry.name.endsWith('.d.ts')) yield full
  }
}

export async function extractKeys() {
  const keys = new Map() // nyckel -> första filen
  for await (const file of walk(SRC)) {
    if (SKIP.some(pattern => pattern.test(file))) continue
    const source = await readFile(file, 'utf8')
    const add = (quote, body) => {
      if (quote === '`' && body.includes('${')) return
      const text = unescapeLiteral(body)
      if (!/[A-Za-zÅÄÖåäö]/.test(text)) return
      if (!keys.has(text)) keys.set(text, path.relative(root, file))
    }
    for (const match of source.matchAll(CALL)) add(match[1], match[2])
    if (MESSAGE_FILES.some(pattern => pattern.test(file))) {
      for (const match of source.matchAll(/(?:\berror|\bmessage):\s*(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) add(match[1], match[2])
      for (const match of source.matchAll(/InputValidationError\(\s*(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) add(match[1], match[2])
    }
  }
  return keys
}

export async function loadDictionary() {
  const merged = {}
  for (const name of (await readdir(DICTIONARY_DIR)).filter(file => file.endsWith('.json')).sort()) {
    Object.assign(merged, JSON.parse(await readFile(path.join(DICTIONARY_DIR, name), 'utf8')))
  }
  return merged
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const en = await loadDictionary().catch(() => ({}))
  const keys = await extractKeys()
  const missing = [...keys].filter(([key]) => !(key in en))
  const unused = Object.keys(en).filter(key => !keys.has(key))
  const out = { total: keys.size, missing: missing.map(([key, file]) => ({ key, file })), unused }
  if (process.argv.includes('--keys')) console.log(JSON.stringify(Object.fromEntries(missing.map(([key]) => [key, ''])), null, 1))
  else console.log(JSON.stringify(out, null, 1))
}
