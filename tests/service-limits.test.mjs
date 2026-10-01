import { test } from 'node:test'
import assert from 'node:assert/strict'
import { capPerProvider, onePerProvider } from '../src/lib/service-limits.mjs'

const rows = ['a1', 'a2', 'b1', 'a3', 'a4', 'c1', 'a5', 'b2'].map(id => ({ id, provider_id: id[0] }))

test('the homepage shows one service per provider, newest first, up to the limit', () => {
  assert.deepEqual(onePerProvider(rows, 6).map(row => row.id), ['a1', 'b1', 'c1'])
  assert.deepEqual(onePerProvider(rows, 2).map(row => row.id), ['a1', 'b1'])
})

test('the service list caps each provider and reports what was hidden', () => {
  const { visible, hidden, lastVisible } = capPerProvider(rows, 3)
  assert.deepEqual(visible.map(row => row.id), ['a1', 'a2', 'b1', 'a3', 'c1', 'b2'])
  assert.equal(hidden.get('a'), 2)
  assert.equal(hidden.has('b'), false)
  assert.equal(lastVisible.get('a'), 'a3')
})
