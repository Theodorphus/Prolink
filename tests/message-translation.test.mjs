import { test } from 'node:test'
import assert from 'node:assert/strict'

async function load() {
  try {
    await import('./helpers/register.mjs')
    return await import('../src/lib/message-translation.ts')
  } catch (error) {
    return { skip: String(error?.message ?? error) }
  }
}

const loaded = await load()
const skip = loaded.skip ? `Node kan inte köra TypeScript direkt här: ${loaded.skip}` : false

function mockAnthropic(handler) {
  const calls = []
  globalThis.fetch = async (url, init) => {
    const items = JSON.parse(JSON.parse(init.body).messages[0].content)
    calls.push(items)
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(handler(items)) }] }) }
  }
  return calls
}

function reset() {
  globalThis.__fakeDb = { rows: [], readError: false }
  process.env.ANTHROPIC_API_KEY = 'test-key'
}

const messages = [{ id: 'a', content: 'Привет, когда начнём?' }, { id: 'b', content: 'Hello there' }, { id: 'c', content: '   ' }]
const answer = items => items.map(item => item.id === 'a'
  ? { id: 'a', lang: 'ru', content: 'Hi, when do we start?' }
  : { id: item.id, lang: 'en', content: item.content })

test('meddelanden översätts, sparas och återanvänds, och tomma hoppas över', { skip }, async () => {
  reset()
  const calls = mockAnthropic(answer)
  const first = await loaded.translateMessages(messages, 'en')
  assert.deepEqual(first.get('a'), { content: 'Hi, when do we start?', same: false })
  assert.equal(first.get('b').same, true, 'redan på läsarens språk')
  assert.equal(first.has('c'), false)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].length, 2, 'det tomma meddelandet skickas inte')

  await loaded.translateMessages(messages, 'en')
  assert.equal(calls.length, 1, 'andra gången kommer allt ur cachen')

  await loaded.translateMessages(messages, 'sv')
  assert.equal(calls.length, 2, 'svenska är ett eget språk i cachen')
})

test('utan nyckel eller cache översätts inget', { skip }, async () => {
  reset()
  const calls = mockAnthropic(answer)
  delete process.env.ANTHROPIC_API_KEY
  assert.equal(await loaded.translateMessages(messages, 'en'), null)
  reset()
  globalThis.__fakeDb.readError = true
  assert.equal(await loaded.translateMessages(messages, 'en'), null)
  assert.equal(calls.length, 0)
})
