import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { extractKeys, loadDictionary } from '../scripts/i18n-keys.mjs'

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

test('varje text i koden har en engelsk översättning', async () => {
  const en = await loadDictionary()
  const keys = await extractKeys()
  const missing = [...keys].filter(([key]) => !(key in en)).map(([key, file]) => `${file}: ${key}`)
  assert.deepEqual(missing, [], `Saknar engelsk översättning. Lägg till dem i src/i18n/en/*.json:\n${missing.join('\n')}`)
})

test('översättningarna är ifyllda och behåller samma platshållare som originalet', async () => {
  const en = await loadDictionary()
  for (const [key, value] of Object.entries(en)) {
    assert.equal(typeof value, 'string', `Värdet för "${key}" ska vara en text`)
    assert.ok(value.trim().length > 0, `Översättningen av "${key}" är tom`)
    assert.deepEqual(placeholders(value), placeholders(key), `Platshållarna i "${key}" och översättningen stämmer inte överens`)
  }
})

test('en översättning är inte kvar på svenska', async () => {
  const en = await loadDictionary()
  // Å, ä och ö finns inte i engelska ord. Egennamn får vara kvar.
  const allowed = new Set(['Salong Lugn', 'Göteborg', 'Gothenburg', 'Västra Gunnesgärde'])
  const offenders = Object.entries(en)
    .filter(([, value]) => /[åäöÅÄÖ]/.test(value) && ![...allowed].some(name => value.includes(name)))
    .map(([key]) => key)
  assert.deepEqual(offenders, [], `Svenska tecken i den engelska texten för:\n${offenders.join('\n')}`)
})

test('ämnesrader från SQL-triggrarna har en översättning', async () => {
  // Notiskön fylls av triggrar som skriver fasta svenska rubriker. E-posten
  // översätter dem vid utskick, så varje rubrik måste finnas i ordlistan.
  const en = await loadDictionary()
  const dir = new URL('../supabase/migrations/', import.meta.url)
  const subjects = new Set()
  for (const name of await readdir(dir)) {
    const sql = await readFile(new URL(name, dir), 'utf8')
    // values (..., 'kind', 'Rubrik', ...) och select ..., 'kind', 'Rubrik', ...
    for (const match of sql.matchAll(/'(?:job|inquiry|offer|accepted|rejected|completed|message|reminder_confirm|reminder_review|offer_edited|welcome)',\s*'([A-ZÅÄÖ][^']*)'/g)) subjects.add(match[1])
    if (/then 'Nytt uppdrag' else 'Ny förfrågan till dig'/.test(sql)) { subjects.add('Nytt uppdrag'); subjects.add('Ny förfrågan till dig') }
  }
  assert.ok(subjects.size >= 8, 'Hittade förvånansvärt få rubriker i migrationerna')
  const missing = [...subjects].filter(subject => !(subject in en))
  assert.deepEqual(missing, [], `Rubriker utan översättning: ${missing.join(', ')}`)
})

test('språk och sökvägar: svenska ligger utan prefix, engelska under /en', async () => {
  const { localePath, splitLocale } = await import('../src/i18n/config.ts').catch(() => ({}))
  if (!localePath) return // Node utan stöd för att köra .ts direkt; typkontrollen täcker filen.
  assert.equal(localePath('sv', '/jobs'), '/jobs')
  assert.equal(localePath('en', '/jobs'), '/en/jobs')
  assert.equal(localePath('en', '/'), '/en')
  assert.equal(localePath('en', '/en/jobs'), '/en/jobs')
  assert.equal(localePath('en', 'https://example.com/x'), 'https://example.com/x')
  assert.equal(localePath('en', '#top'), '#top')
  assert.equal(localePath('en', '/jobs?page=2'), '/en/jobs?page=2')
  assert.deepEqual(splitLocale('/en/jobs/1'), { locale: 'en', path: '/jobs/1', prefixed: true })
  assert.deepEqual(splitLocale('/en'), { locale: 'en', path: '/', prefixed: true })
  assert.deepEqual(splitLocale('/jobs'), { locale: 'sv', path: '/jobs', prefixed: false })
  assert.deepEqual(splitLocale('/english'), { locale: 'sv', path: '/english', prefixed: false })
})
