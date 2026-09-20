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

test('utskick kastar i stället för att tyst svälja ett nekat svar', async () => {
  // Resend kastar inte vid HTTP-fel utan returnerar { data, error }. Tidigare
  // returnerades resultatet rakt av, så ett nekat utskick (403 för overifierad
  // avsändardomän) såg ut som ett lyckat anrop och anroparnas try/catch fångade
  // ingenting. Felet blev därmed helt osynligt i produktion.
  const emailUrl = new URL('../src/lib/email.ts', import.meta.url)
  const source = await readFile(emailUrl, 'utf8')

  assert.match(source, /if \(result\.error\)/, 'svaret från Resend måste felkontrolleras')
  assert.match(source, /throw new Error\(`Resend nekade utskicket/, 'ett nekat utskick ska kasta')
  assert.ok(
    !/return resend\.emails\.send\(/.test(source),
    'inget utskick får gå förbi send()-omslaget'
  )
  assert.match(source, /export function emailConfigurationProblem/, 'felkonfiguration ska kunna upptäckas')
})

test('nytt uppdrag notifierar leverantörer', async () => {
  // Marknadsplatsen saknade notis åt utbudshållet: ingen leverantör fick veta
  // att ett uppdrag publicerats, vilket är en rimlig delförklaring till noll
  // offerter. Regressionsskyddet säkrar att kopplingen finns kvar.
  const routeUrl = new URL('../src/app/api/jobs/route.ts', import.meta.url)
  const source = await readFile(routeUrl, 'utf8')

  assert.match(source, /sendNewJobEmail/, 'uppdragsrutten ska skicka notismejl')
  assert.match(source, /\.eq\('role', 'provider'\)/, 'bara leverantörer ska notifieras')
  assert.match(source, /\.neq\('id', customerId\)/, 'kunden ska inte notifiera sig själv')
  assert.match(source, /catch/, 'notisen ska vara best effort och aldrig blockera publiceringen')
})

test('oauth-rollen kan bara sättas när kontot skapas', async () => {
  // role kommer från en URL-parameter och kan sättas av vem som helst. Om den
  // tillämpas vid varje inloggning kan ett besök på
  // /auth/callback?role=customer tyst skriva om rollen för en befintlig
  // leverantör. Inloggningsknappen skickar ingen roll; bara registreringen.
  const callbackUrl = new URL('../src/app/auth/callback/route.ts', import.meta.url)
  const source = await readFile(callbackUrl, 'utf8')

  assert.match(source, /isNewUser/, 'rollen ska villkoras av att kontot är nytt')
  assert.match(
    source,
    /if \(isNewUser && role/,
    'rolluppdateringen måste vara villkorad av isNewUser'
  )
  assert.ok(
    !/^\s*if \(role && \['customer', 'provider'\]\.includes\(role\)\) \{/m.test(source),
    'den ovillkorade rolltilldelningen får inte finnas kvar'
  )
})

test('konversationslistan ordnar inbäddade meddelanden explicit', async () => {
  // .order() på frågan gäller offers, inte den inbäddade messages-listan.
  // Utan referencedTable returnerar Postgres dem i godtycklig ordning, och
  // både förhandsvisningen och sorteringen antar att sista elementet är det
  // senaste meddelandet.
  const pageUrl = new URL('../src/app/messages/page.tsx', import.meta.url)
  const source = await readFile(pageUrl, 'utf8')

  const embeddedOrders = source.match(/referencedTable: 'messages'/g) ?? []
  assert.equal(embeddedOrders.length, 2, 'båda frågorna ska ordna messages explicit')
  assert.ok(
    !/msgs\.sort\(/.test(source),
    'computeUnread ska inte mutera arrayen som förhandsvisningen läser'
  )
})

test('fritextsökningen kan inte injicera i postgrest-filtret', async () => {
  // Söktermen interpolerades rakt in i en or()-sträng. Kommatecken, punkter
  // och parenteser är syntax i PostgREST:s filterspråk, så en term som
  // "zzzz%,id.not.is.null,title.ilike.%" bröt sig ur sitt eget villkor och
  // blev ett extra predikat: en nonsenssökning returnerade hela tabellen.
  // Verifierat mot den hostade databasen innan fixen (3 träffar -> 0).
  const validationUrl = new URL('../src/lib/validation.ts', import.meta.url)
  const source = await readFile(validationUrl, 'utf8')
  assert.match(source, /export function searchTerm/, 'saneringen ska finnas')

  const start = source.indexOf('export function searchTerm')
  const searchTerm = new Function(
    `${source.slice(start)
      .replace('export function', 'function')
      .replace('value: unknown, maxLength = 120): string | null', 'value, maxLength = 120)')}\nreturn searchTerm;`
  )()

  const payload = 'zzzz%,id.not.is.null,title.ilike.%'
  const cleaned = searchTerm(payload)
  assert.ok(!cleaned.includes(','), 'kommatecken avslutar ett villkor och måste bort')
  assert.ok(!cleaned.includes('.'), 'punkt separerar kolumn och operator och måste bort')
  assert.ok(cleaned.includes('\\%'), 'jokertecken ska vara escapade')
  assert.equal(searchTerm('webb'), 'webb', 'vanliga sökningar ska vara oförändrade')
  assert.equal(searchTerm('   '), null, 'tom sökning ska ge null')

  // Båda sidorna måste faktiskt använda saneringen.
  for (const page of ['../src/app/jobs/page.tsx', '../src/app/services/page.tsx']) {
    const pageSource = await readFile(new URL(page, import.meta.url), 'utf8')
    assert.match(pageSource, /searchTerm\(q\)/, `${page} ska sanera söktermen`)
    assert.ok(
      !/ilike\.%\$\{q\}%/.test(pageSource),
      `${page} får inte interpolera den råa söktermen`
    )
  }
})

test('skrivande endpoints är hastighetsbegränsade', async () => {
  // Produkten hade ingen begränsning alls. Alla skrivande rutter kräver
  // inloggning, men ett enda konto kunde skapa obegränsat många uppdrag,
  // offerter och meddelanden i en slinga — och varje offert och meddelande
  // utlöser dessutom ett mejlutskick.
  const routes = [
    ['../src/app/api/jobs/route.ts', 'jobs:create'],
    ['../src/app/api/offers/route.ts', 'offers:create'],
    ['../src/app/api/services/route.ts', 'services:create'],
    ['../src/app/api/messages/[offerId]/route.ts', 'messages:send'],
    ['../src/app/api/reviews/route.ts', 'reviews:create'],
  ]

  for (const [route, action] of routes) {
    const source = await readFile(new URL(route, import.meta.url), 'utf8')
    assert.ok(
      source.includes(`withinRateLimit(supabase, '${action}')`),
      `${route} ska kontrollera kvoten för ${action}`
    )
    assert.match(source, /status: 429/, `${route} ska svara 429 när kvoten är slut`)
  }

  // Räknaren måste ligga i databasen. Applikationen kör serverlöst, så en
  // minnesbaserad räknare hade begränsat per instans i stället för per
  // användare och i praktiken inte begränsat någonting.
  const migration = await readFile(
    new URL('../supabase/migrations/013_rate_limiting.sql', import.meta.url),
    'utf8'
  )
  assert.match(migration, /create table if not exists public\.rate_limits/)
  assert.match(migration, /security definer/, 'funktionen måste kringgå RLS för att kunna räkna')
  assert.match(
    migration,
    /revoke all on table public\.rate_limits from anon, authenticated/,
    'en klient får inte kunna rensa sin egen räknare'
  )
  assert.match(migration, /auth\.uid\(\)/, 'kvoten ska räknas per inloggad användare')
})

test('tjänstekategorier hålls i synk mellan kod och databas', async () => {
  // Två av tre tjänster var osynliga i bläddringen: en hade category = null och
  // en hade 'ekonomi', ett värde som aldrig funnits i CATEGORIES (Phase 2 döpte
  // om etiketten, inte värdet). Eftersom /services filtrerar med
  // .eq('category', ...) matchar sådana rader ingen kategori alls.
  const categoriesSource = await readFile(
    new URL('../src/lib/categories.ts', import.meta.url),
    'utf8'
  )
  const values = [...categoriesSource.matchAll(/\{ value: '([^']+)'/g)].map(m => m[1])
  assert.ok(values.length >= 5, 'kategorilistan ska kunna läsas ur källkoden')

  const migration = await readFile(
    new URL('../supabase/migrations/014_service_category_required.sql', import.meta.url),
    'utf8'
  )

  const constraint = migration.match(/services_category_valid\s*\n\s*check \(category in \(([^)]+)\)/)
  assert.ok(constraint, 'kontrollvillkoret ska finnas i migrationen')

  const allowed = [...constraint[1].matchAll(/'([^']+)'/g)].map(m => m[1])
  assert.deepEqual(
    [...allowed].sort(),
    [...values].sort(),
    'villkoret i databasen måste spegla CATEGORIES exakt'
  )

  assert.match(migration, /alter column category set not null/, 'kategori ska vara obligatorisk')
})
