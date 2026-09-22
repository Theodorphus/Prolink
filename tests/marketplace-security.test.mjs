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

test('varje kategorilandningssida har eget innehåll', async () => {
  // Sidorna finns för att rankas i sök. En sida som bara upprepar samma text
  // med ett annat filter är tunt innehåll som varken rankar eller hjälper
  // besökaren, så varje kategori måste ha egen rubrik, egna exempel och egna
  // frågor.
  const source = await readFile(new URL('../src/lib/category-content.ts', import.meta.url), 'utf8')

  const headings = [...source.matchAll(/heading:\s*'([^']+)'/g)].map(m => m[1])
  assert.ok(headings.length >= 8, `förväntade minst 8 landningssidor, fick ${headings.length}`)
  assert.equal(new Set(headings).size, headings.length, 'varje sida måste ha en unik rubrik')

  const descriptions = [...source.matchAll(/description:\s*\n?\s*'([^']+)'/g)].map(m => m[1])
  assert.equal(new Set(descriptions).size, descriptions.length, 'metabeskrivningarna måste vara unika')
  for (const d of descriptions) {
    assert.ok(d.length <= 175, `metabeskrivning för lång (${d.length} tecken): ${d.slice(0, 50)}…`)
  }

  // Kategorier utan innehåll får inte länkas från rutnätet på startsidan,
  // eftersom sidan då skulle ge 404.
  const grid = await readFile(new URL('../src/components/home/CompetenceGrid.tsx', import.meta.url), 'utf8')
  if (grid.includes('/hitta/')) {
    assert.match(grid, /category\.value !== 'annat'/, 'annat saknar landningssida och måste filtreras bort')
  }

  // Sidorna ska finnas i sitemapen, annars hittar sökmotorerna dem inte.
  const sitemaps = await readFile(new URL('../src/lib/sitemaps.ts', import.meta.url), 'utf8')
  assert.match(sitemaps, /\/hitta\//, 'landningssidorna måste ingå i sitemapen')
})

test('inbäddade omdömen namnger relationen explicit', async () => {
  // reviews har två främmande nycklar till users, reviewer_id och
  // reviewee_id. En inbäddning som bara säger users är därför tvetydig och
  // avvisas av PostgREST med 300 (PGRST201). Det tog ner varje profilsida
  // med 500, och på tjänstesidan svaldes felet så att omdömen tyst försvann.
  for (const page of ['../src/app/profile/[id]/page.tsx', '../src/app/services/[id]/page.tsx']) {
    const source = await readFile(new URL(page, import.meta.url), 'utf8')
    const embeds = source.match(/reviewer:users[^(]*/g) ?? []
    assert.ok(embeds.length > 0, `${page} förväntas bädda in reviewer`)
    for (const embed of embeds) {
      assert.match(
        embed,
        /reviewer:users!reviews_reviewer_id_fkey/,
        `${page} måste namnge relationen, annars blir inbäddningen tvetydig`
      )
    }
  }
})
