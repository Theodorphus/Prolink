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

test('the permissive review policy that bypassed the strict one is dropped', async () => {
  // Migration 010 added a strict insert policy for reviews but left the older
  // permissive policy in place. Postgres ORs permissive policies together, so
  // any authenticated user could review any other user without a completed
  // offer. Migration 012 removes the weak policy.
  const migrationUrl = new URL('../supabase/migrations/012_fix_review_policy_bypass.sql', import.meta.url)
  const sql = await readFile(migrationUrl, 'utf8')

  assert.match(sql, /drop policy if exists "Inloggade kan skriva recensioner" on public\.reviews/i)

  const baselineUrl = new URL('../supabase/migrations/010_phase1_security_baseline.sql', import.meta.url)
  const baseline = await readFile(baselineUrl, 'utf8')
  assert.match(baseline, /completed offer participants can write review/i)
})

test('public job selections never expose employer contact details', async () => {
  // The public job queries must not return employer_email or contact_info.
  // Both columns are readable by the anon role in the database, so the
  // restriction has to happen in the selected column list.
  const jobsUrl = new URL('../src/lib/jobs.ts', import.meta.url)
  const source = await readFile(jobsUrl, 'utf8')

  // Assert against the field list itself, not the file: the surrounding comment
  // names both columns on purpose to explain why they are excluded.
  const fieldList = source.match(/PUBLIC_JOB_FIELDS[\s\S]*?'([^']+)'/)
  assert.ok(fieldList, 'PUBLIC_JOB_FIELDS måste vara en literal strängkonstant')

  const fields = fieldList[1].split(',').map(field => field.trim())
  assert.ok(!fields.includes('employer_email'), 'employer_email får inte ingå')
  assert.ok(!fields.includes('contact_info'), 'contact_info får inte ingå')
  assert.ok(fields.includes('title'), 'listan ska innehålla de publika fälten')
})
