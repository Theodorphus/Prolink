// Samlar alla texter som ska översättas. Den svenska texten är nyckeln: den
// står antingen i ett anrop t('...') / msg('...'), eller, för felmeddelanden
// som servern skickar och webbläsaren översätter, som error: '...' i API-rutter
// och server actions. Används av tests/i18n.test.mjs och av
// `node scripts/i18n-keys.mjs` som skriver ut nycklarna som saknas på engelska.
// Med --server-only skrivs listan över texter som inte skickas till webbläsaren.
import { readdir, readFile, writeFile } from 'node:fs/promises'
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

// Texter som bara översätts på servern behöver inte skickas till webbläsaren.
// Den engelska ordlistan följde annars med i sin helhet på varje sida under /en
// (870 texter, drygt 20 kB komprimerat).
//
// En text räknas som serverns bara om varje förekomst är ett t('...')-anrop i
// en modul som ingen klientkomponent importerar, direkt eller indirekt. Allt
// annat skickas med: msg('...') (kan översättas var som helst), texter i
// klientmoduler, och felmeddelandena i MESSAGE_FILES och messages.json, som
// servern skickar och webbläsaren översätter. Listan sparas i
// SERVER_ONLY_FILE och kontrolleras av tests/i18n.test.mjs. En inaktuell lista
// kan bara skicka med för mycket, utom när en text flyttar från servern till
// en klientkomponent, och det fångar testet.
export const SERVER_ONLY_FILE = path.join(SRC, 'i18n', 'server-only-keys.json')

function resolveImport(files, from, spec) {
  const base = spec.startsWith('@/') ? path.join(SRC, spec.slice(2))
    : spec.startsWith('.') ? path.resolve(path.dirname(from), spec)
    : null
  if (!base) return null
  const candidates = [base, ...['.ts', '.tsx', '.mjs', '.js'].map(ext => base + ext), path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
  return candidates.find(candidate => files.has(candidate)) ?? null
}

export async function extractServerOnlyKeys() {
  const files = new Map()
  for await (const file of walk(SRC)) files.set(file, await readFile(file, 'utf8'))

  // Alla moduler som hamnar i webbläsaren: 'use client'-filer och allt de importerar.
  const client = new Set()
  const queue = [...files.keys()].filter(file => /^\s*['"]use client['"]/.test(files.get(file)))
  const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
  while (queue.length) {
    const file = queue.pop()
    if (client.has(file)) continue
    client.add(file)
    for (const match of files.get(file).matchAll(IMPORT)) {
      const target = resolveImport(files, file, match[1] ?? match[2])
      if (target) queue.push(target)
    }
  }

  const needed = new Set(Object.keys(JSON.parse(await readFile(path.join(DICTIONARY_DIR, 'messages.json'), 'utf8'))))
  for (const [file, source] of files) {
    const everything = client.has(file) || MESSAGE_FILES.some(pattern => pattern.test(file))
    // Samma mönster som CALL. Funktionsnamnet får ingen egen grupp, eftersom
    // LITERAL bakåtrefererar till grupp 1 (citattecknet).
    for (const match of source.matchAll(CALL)) {
      if (everything || match[0].startsWith('msg')) needed.add(unescapeLiteral(match[2]))
    }
  }

  // content.json skickas aldrig till webbläsaren och hålls utanför listan.
  const content = JSON.parse(await readFile(path.join(DICTIONARY_DIR, 'content.json'), 'utf8'))
  const dictionary = await loadDictionary()
  return Object.keys(dictionary).filter(key => !needed.has(key) && !(key in content)).sort()
}

export async function loadDictionary() {
  const merged = {}
  for (const name of (await readdir(DICTIONARY_DIR)).filter(file => file.endsWith('.json')).sort()) {
    Object.assign(merged, JSON.parse(await readFile(path.join(DICTIONARY_DIR, name), 'utf8')))
  }
  return merged
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--server-only')) {
  const keys = await extractServerOnlyKeys()
  await writeFile(SERVER_ONLY_FILE, JSON.stringify(keys, null, 1) + '\n')
  console.log(`${keys.length} texter skickas inte till webbläsaren. Skrev ${path.relative(root, SERVER_ONLY_FILE)}.`)
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const en = await loadDictionary().catch(() => ({}))
  const keys = await extractKeys()
  const missing = [...keys].filter(([key]) => !(key in en))
  const unused = Object.keys(en).filter(key => !keys.has(key))
  const out = { total: keys.size, missing: missing.map(([key, file]) => ({ key, file })), unused }
  if (process.argv.includes('--keys')) console.log(JSON.stringify(Object.fromEntries(missing.map(([key]) => [key, ''])), null, 1))
  else console.log(JSON.stringify(out, null, 1))
}
