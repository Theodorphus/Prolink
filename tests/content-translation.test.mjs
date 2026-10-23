import { test } from 'node:test'
import assert from 'node:assert/strict'

// Modulen är TypeScript med @/-alias. Hjälparna i tests/helpers låter node köra
// den direkt. Saknar Node stöd för att köra .ts (äldre än 22.18) hoppas testet
// över; typkontrollen och bygget täcker filen ändå.
async function load() {
  try {
    await import('./helpers/register.mjs')
    return await import('../src/lib/content-translation.ts')
  } catch (error) {
    return { skip: String(error?.message ?? error) }
  }
}

const loaded = await load()
const skip = loaded.skip ? `Node kan inte köra TypeScript direkt här: ${loaded.skip}` : false

const job = (id, title = 'Bygga hemsida åt frisör', description = 'Enkel hemsida med kontaktformulär') => ({ id, title, description, budget: 5000 })

function mockAnthropic(handler) {
  const calls = []
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body)
    const items = JSON.parse(body.messages[0].content)
    calls.push({ url, items, headers: init.headers })
    const reply = handler(items)
    if (reply === 'http-error') return { ok: false, status: 529, json: async () => ({}) }
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: typeof reply === 'string' ? reply : JSON.stringify(reply) }] }) }
  }
  return calls
}

function reset() {
  globalThis.__fakeDb = { rows: [], readError: false }
  process.env.ANTHROPIC_API_KEY = 'test-key'
}

const translateAll = items => items.map(item => ({ id: item.id, lang: 'sv', title: `EN ${item.title}`, description: `EN ${item.description}` }))

test('en svensk annons visas orörd för svenska besökare, och översättningen sparas som orörd', { skip }, async () => {
  reset()
  const calls = mockAnthropic(items => items.map(item => ({ id: item.id, lang: 'sv', title: item.title, description: item.description })))
  const rows = [job('1')]
  assert.deepEqual(await loaded.translateListings('job', rows, 'sv'), rows)
  assert.equal(calls.length, 1)
  assert.deepEqual(await loaded.translateListings('job', rows, 'sv'), rows)
  assert.equal(calls.length, 1, 'andra visningen ska komma ur cachen')
})

test('en rysk annons översätts till sidans språk, svenska som engelska', { skip }, async () => {
  reset()
  const russian = job('1', 'Монтаж фото та відео', 'Монтаж фото та відео')
  const calls = mockAnthropic(items => items.map(item => ({ id: item.id, lang: 'uk', title: `T ${item.title}`, description: `T ${item.description}` })))
  const sv = await loaded.translateListings('job', [russian], 'sv')
  assert.equal(sv[0].title, 'T Монтаж фото та відео')
  assert.equal(sv[0].autoTranslated, true)
  const en = await loaded.translateListings('job', [russian], 'en')
  assert.equal(en[0].autoTranslated, true)
  assert.equal(calls.length, 2, 'ett anrop per språk')
  assert.deepEqual(globalThis.__fakeDb.rows.map(row => row.lang).sort(), ['en', 'sv'])
  assert.equal(globalThis.__fakeDb.rows[0].source_lang, 'uk')
})

test('utan API-nyckel visas originaltexten', { skip }, async () => {
  reset()
  delete process.env.ANTHROPIC_API_KEY
  const calls = mockAnthropic(translateAll)
  const rows = [job('1')]
  assert.deepEqual(await loaded.translateListings('job', rows, 'en'), rows)
  assert.equal(calls.length, 0)
})

test('engelska besökare får översättningen, som sparas och återanvänds', { skip }, async () => {
  reset()
  const calls = mockAnthropic(translateAll)
  const first = await loaded.translateListings('job', [job('1'), job('2', 'Logotyp', 'Ny logotyp')], 'en')
  assert.equal(first[0].title, 'EN Bygga hemsida åt frisör')
  assert.equal(first[0].autoTranslated, true)
  assert.equal(first[0].budget, 5000, 'övriga fält ska följa med orörda')
  assert.equal(calls.length, 1, 'alla annonser går i samma anrop')
  assert.equal(calls[0].headers['x-api-key'], 'test-key')
  assert.equal(globalThis.__fakeDb.rows.length, 2)

  const second = await loaded.translateListings('job', [job('1'), job('2', 'Logotyp', 'Ny logotyp')], 'en')
  assert.equal(second[1].title, 'EN Logotyp')
  assert.equal(calls.length, 1, 'andra visningen ska komma ur cachen')
})

test('en redigerad annons översätts om, och originalet kan väljas', { skip }, async () => {
  reset()
  const calls = mockAnthropic(translateAll)
  await loaded.translateListings('job', [job('1')], 'en')
  const edited = await loaded.translateListings('job', [job('1', 'Ny titel', 'Ny text')], 'en')
  assert.equal(edited[0].title, 'EN Ny titel')
  assert.equal(calls.length, 2)

  const original = await loaded.translateListings('job', [job('1')], 'en', { original: true })
  assert.equal(original[0].title, 'Bygga hemsida åt frisör')
  assert.equal(original[0].autoTranslated, undefined)
})

test('saknas cachetabellen översätts inget, så att varje sidvisning inte kostar ett anrop', { skip }, async () => {
  reset()
  globalThis.__fakeDb.readError = true
  const calls = mockAnthropic(translateAll)
  const rows = [job('1')]
  assert.deepEqual(await loaded.translateListings('job', rows, 'en'), rows)
  assert.equal(calls.length, 0)
})

test('fel från översättningstjänsten ger originaltexten och sparar ingenting', { skip }, async () => {
  reset()
  mockAnthropic(() => 'http-error')
  const rows = [job('1')]
  assert.deepEqual(await loaded.translateListings('job', rows, 'en'), rows)
  assert.equal(globalThis.__fakeDb.rows.length, 0)

  mockAnthropic(() => 'detta är inte JSON')
  assert.deepEqual(await loaded.translateListings('job', rows, 'en'), rows)

  // Okända id:n och tomma titlar i svaret ignoreras.
  mockAnthropic(() => [{ id: 'okänt', title: 'x', description: 'y' }, { id: '1', title: '  ', description: 'z' }])
  assert.deepEqual(await loaded.translateListings('job', rows, 'en'), rows)
  assert.equal(globalThis.__fakeDb.rows.length, 0)
})

test('rubriker ur cachen kräver inga API-anrop', { skip }, async () => {
  reset()
  const calls = mockAnthropic(translateAll)
  await loaded.translateListings('job', [job('1')], 'en')
  const titles = await loaded.cachedTitles('job', ['1', '2'], 'en')
  assert.equal(titles.get('1'), 'EN Bygga hemsida åt frisör')
  assert.equal(titles.has('2'), false)
  assert.equal(calls.length, 1)
  assert.equal((await loaded.cachedTitles('job', ['1'], 'sv')).size, 0, 'svenska är ett eget språk i cachen')
})
