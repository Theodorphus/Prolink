import { test } from 'node:test'
import assert from 'node:assert/strict'
import { premiumEvents } from '../src/lib/premium-events.mjs'

const row = (status, cancel = false) => ({ status, cancel_at_period_end: cancel })
const now = (status, cancelAtPeriodEnd = false) => ({ status, cancelAtPeriodEnd })

test('ett nytt abonnemang ger ett välkomstmejl, men bara en gång', () => {
  assert.deepEqual(premiumEvents(row('none'), now('active')), ['started'])
  assert.deepEqual(premiumEvents(null, now('active')), ['started'])
  assert.deepEqual(premiumEvents(row('active'), now('active')), [])
})

test('uppsägning mejlas när den görs, inte varje gång Stripe skickar om den', () => {
  assert.deepEqual(premiumEvents(row('active'), now('active', true)), ['cancel_scheduled'])
  assert.deepEqual(premiumEvents(row('active', true), now('active', true)), [])
})

test('uteblivd betalning och återhämtning skiljs från start och slut', () => {
  assert.deepEqual(premiumEvents(row('active'), now('past_due')), ['payment_failed'])
  assert.deepEqual(premiumEvents(row('past_due'), now('past_due')), [])
  assert.deepEqual(premiumEvents(row('past_due'), now('active')), [])
  assert.deepEqual(premiumEvents(row('past_due'), now('canceled')), ['ended'])
})

test('avslut mejlas bara för ett abonnemang som varit igång', () => {
  assert.deepEqual(premiumEvents(row('active', true), now('canceled')), ['ended'])
  assert.deepEqual(premiumEvents(row('none'), now('incomplete_expired')), [])
  assert.deepEqual(premiumEvents(row('canceled'), now('canceled')), [])
})
