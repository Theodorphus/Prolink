import { test } from 'node:test'
import assert from 'node:assert/strict'
import { messageCursor } from '../src/lib/message-cursor.mjs'

const id = '11111111-1111-4111-8111-111111111111'
test('chat pagination preserves database microseconds in both directions', () => {
  for (const direction of ['after', 'before']) {
    const time = '2026-09-22T12:00:00.123456+00:00'
    const cursor = messageCursor(new URLSearchParams({ [direction]: time, [`${direction}_id`]: id }))
    assert.equal(cursor.forward, direction === 'after')
    assert.ok(cursor.filter.includes(`created_at.eq.${time}`))
    assert.ok(cursor.filter.includes(`created_at.${direction === 'after' ? 'gt' : 'lt'}.${time}`))
  }
})
test('chat pagination rejects partial, mixed and injectable cursors', () => {
  for (const values of [
    { after: '2026-09-22T12:00:00Z' }, { before_id: id },
    { after: '2026-09-22T12:00:00Z', after_id: id, before_id: id },
    { before: 'not-a-date', before_id: id },
    { after: '2026-09-22T12:00:00Z,id.not.is.null', after_id: id },
    { after: '2026-09-22T12:00:00Z', after_id: 'invalid' },
  ]) assert.throws(() => messageCursor(new URLSearchParams(values)))
  assert.equal(messageCursor(new URLSearchParams()), null)
})
