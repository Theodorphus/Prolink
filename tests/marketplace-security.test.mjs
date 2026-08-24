import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  canSubmitOffer,
  canTransitionOffer,
  hasMultipleWinningOffers,
  isAttachmentPathForOffer,
  isOfferParticipant,
  requiredActorForTransition,
} from '../src/lib/marketplace-rules.mjs'

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111'
const PROVIDER_ID = '22222222-2222-4222-8222-222222222222'
const OUTSIDER_ID = '33333333-3333-4333-8333-333333333333'
const OFFER_ID = '44444444-4444-4444-8444-444444444444'

test('only a provider may offer on another user\'s open request', () => {
  assert.equal(canSubmitOffer({
    actorId: PROVIDER_ID,
    actorRole: 'provider',
    requestOwnerId: CUSTOMER_ID,
    requestStatus: 'open',
  }), true)

  assert.equal(canSubmitOffer({
    actorId: CUSTOMER_ID,
    actorRole: 'provider',
    requestOwnerId: CUSTOMER_ID,
    requestStatus: 'open',
  }), false)

  assert.equal(canSubmitOffer({
    actorId: PROVIDER_ID,
    actorRole: 'customer',
    requestOwnerId: CUSTOMER_ID,
    requestStatus: 'open',
  }), false)

  assert.equal(canSubmitOffer({
    actorId: PROVIDER_ID,
    actorRole: 'provider',
    requestOwnerId: CUSTOMER_ID,
    requestStatus: 'closed',
  }), false)
})

test('offer lifecycle permits only the intended actor and sequence', () => {
  assert.equal(requiredActorForTransition('pending', 'accepted'), 'customer')
  assert.equal(requiredActorForTransition('pending', 'rejected'), 'customer')
  assert.equal(requiredActorForTransition('accepted', 'delivered'), 'provider')
  assert.equal(requiredActorForTransition('delivered', 'completed'), 'customer')
  assert.equal(requiredActorForTransition('pending', 'delivered'), null)
  assert.equal(requiredActorForTransition('accepted', 'completed'), null)

  assert.equal(canTransitionOffer({
    actorId: CUSTOMER_ID,
    customerId: CUSTOMER_ID,
    providerId: PROVIDER_ID,
    currentStatus: 'pending',
    nextStatus: 'accepted',
  }), true)

  assert.equal(canTransitionOffer({
    actorId: PROVIDER_ID,
    customerId: CUSTOMER_ID,
    providerId: PROVIDER_ID,
    currentStatus: 'pending',
    nextStatus: 'delivered',
  }), false)

  assert.equal(canTransitionOffer({
    actorId: CUSTOMER_ID,
    customerId: CUSTOMER_ID,
    providerId: PROVIDER_ID,
    currentStatus: 'accepted',
    nextStatus: 'completed',
  }), false)
})

test('only participants and paths scoped to the offer are accepted', () => {
  assert.equal(isOfferParticipant(CUSTOMER_ID, CUSTOMER_ID, PROVIDER_ID), true)
  assert.equal(isOfferParticipant(PROVIDER_ID, CUSTOMER_ID, PROVIDER_ID), true)
  assert.equal(isOfferParticipant(OUTSIDER_ID, CUSTOMER_ID, PROVIDER_ID), false)

  assert.equal(isAttachmentPathForOffer(`${OFFER_ID}/document.pdf`, OFFER_ID), true)
  assert.equal(isAttachmentPathForOffer(`${OUTSIDER_ID}/document.pdf`, OFFER_ID), false)
  assert.equal(isAttachmentPathForOffer(`${OFFER_ID}/../secret.pdf`, OFFER_ID), false)
})

test('multiple winning offers are detected across the whole delivery lifecycle', () => {
  assert.equal(hasMultipleWinningOffers(['pending', 'rejected']), false)
  assert.equal(hasMultipleWinningOffers(['accepted', 'rejected']), false)
  assert.equal(hasMultipleWinningOffers(['accepted', 'delivered']), true)
  assert.equal(hasMultipleWinningOffers(['delivered', 'completed']), true)
})

test('security migration contains database enforcement for winner and private storage', async () => {
  const migrationUrl = new URL('../supabase/migrations/010_phase1_security_baseline.sql', import.meta.url)
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(sql, /create unique index if not exists offers_one_winner_per_job_idx/i)
  assert.match(sql, /where status in \('accepted', 'delivered', 'completed'\)/i)
  assert.match(sql, /create or replace function public\.transition_offer/i)
  assert.match(sql, /set\s+public\s*=\s*false[\s\S]*where id = 'cvs'/i)
  assert.match(sql, /o\.id::text = \(storage\.foldername\(name\)\)\[1\]/i)
  assert.match(sql, /auth\.uid\(\) in \(o\.provider_id, j\.customer_id\)/i)
  assert.match(sql, /revoke select, insert, update on table public\.users from anon, authenticated/i)
})
