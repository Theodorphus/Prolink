import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildAdminInsights, parseEmailList } from '../src/lib/admin-insights.mjs'

const now = Date.parse('2026-10-01T12:00:00Z')
const daysAgo = days => new Date(now - days * 86_400_000).toISOString()
const user = (id, role, created_at, extra = {}) => ({ id, role, name: id, bio: null, skills: null, avatar_url: null, created_at, ...extra })

function fixture() {
  return {
    internalEmails: ['theo@example.com'],
    authUsers: [
      { id: 'theo', email: 'Theo@Example.com', email_confirmed_at: daysAgo(90) },
      { id: 'early', email: 'early@example.com', email_confirmed_at: daysAgo(60) },
      { id: 'late', email: 'late@example.com', email_confirmed_at: null, app_metadata: { provider: 'google' } },
      { id: 'buyer', email: 'buyer@example.com', email_confirmed_at: daysAgo(40) },
    ],
    users: [
      user('theo', 'customer', daysAgo(90)),
      user('early', 'provider', daysAgo(60), { bio: 'Hej', skills: ['React'], avatar_url: 'x' }),
      user('late', 'provider', daysAgo(3)),
      user('buyer', 'customer', daysAgo(40)),
    ],
    privateProfiles: [{ user_id: 'late', email_jobs: false, notification_categories: [] }],
    jobs: [
      { id: 'fake', customer_id: 'theo', requested_provider_id: null, service_id: null, title: 'Påhittat', category: 'design', budget: 5000, status: 'open', archived_at: null, created_at: daysAgo(30) },
      { id: 'real', customer_id: 'buyer', requested_provider_id: 'early', service_id: 'svc', title: 'Riktig förfrågan', category: 'webbutveckling', budget: null, status: 'open', archived_at: null, created_at: daysAgo(5) },
    ],
    offers: [
      { id: 'o1', job_id: 'fake', provider_id: 'early', price: 4000, price_type: 'fixed', status: 'pending', customer_read_at: null, created_at: daysAgo(20) },
    ],
    messages: [
      { offer_id: 'o1', sender_id: 'early', created_at: daysAgo(19) },
      { offer_id: 'o1', sender_id: 'theo', created_at: daysAgo(19) },
    ],
    services: [{ id: 'svc', provider_id: 'early', title: 'Webbplats', category: 'webbutveckling', price: 9000, created_at: daysAgo(50) }],
    reviews: [],
    outbox: [
      { kind: 'job', path: '/jobs/fake', sent_at: daysAgo(30), attempts: 1, created_at: daysAgo(30) },
      { kind: 'inquiry', path: '/jobs/real', sent_at: null, attempts: 8, created_at: daysAgo(5) },
    ],
  }
}

test('admin email lists are trimmed, lower-cased and tolerate separators', () => {
  assert.deepEqual(parseEmailList(' A@x.se, b@y.se;c@z.se \n'), ['a@x.se', 'b@y.se', 'c@z.se'])
  assert.deepEqual(parseEmailList(undefined), [])
})

test('internal accounts are excluded from demand but offers on their jobs count as interest', () => {
  const insights = buildAdminInsights(fixture(), now)
  assert.equal(insights.kpis.externalCustomers, 1)
  assert.equal(insights.kpis.externalProviders, 2)
  assert.equal(insights.kpis.externalInquiries, 1)
  assert.equal(insights.kpis.externalPublicJobs, 0)
  assert.equal(insights.kpis.internalJobs, 1)
  assert.equal(insights.kpis.realOffersOnInternalJobs, 1)
  assert.equal(insights.kpis.realOffersOnExternalJobs, 0)
  assert.equal(insights.kpis.realMessages, 1)
  assert.deepEqual(insights.internalJobs.map(job => job.id), ['fake'])
  assert.equal(insights.people.find(person => person.id === 'theo').internal, true)
})

test('jobs report notifications and providers who joined after publication', () => {
  const [fake] = buildAdminInsights(fixture(), now).internalJobs
  assert.equal(fake.notifiedDelivered, 1)
  assert.equal(fake.providersJoinedAfter, 1)
  assert.equal(fake.offers[0].messages, 2)
  assert.equal(fake.offers[0].providerName, 'early')
})

test('alerts surface failed mail, missing demand and unconfirmed accounts', () => {
  const input = fixture()
  input.users[3].created_at = daysAgo(45)
  const insights = buildAdminInsights(input, now)
  const text = insights.alerts.map(alert => alert.text).join('\n')
  assert.equal(insights.alerts[0].level, 'critical')
  assert.match(text, /misslyckats åtta gånger/)
  assert.match(text, /Inga nya uppdragsgivare de senaste 30 dagarna, men 1 nya frilansare/)
  assert.match(text, /väntat mer än två dygn utan offert/)
  assert.match(text, /1 konton har inte bekräftat/)
  assert.match(text, /1 frilansare har stängt av mejl/)
})

test('profile gaps, services and weekly buckets are computed', () => {
  const insights = buildAdminInsights(fixture(), now)
  assert.deepEqual(insights.people.find(person => person.id === 'late').missing, ['profilbild', 'beskrivning', 'kompetenser', 'tjänst'])
  assert.deepEqual(insights.people.find(person => person.id === 'early').missing, [])
  assert.equal(insights.services[0].inquiries, 1)
  assert.equal(insights.weekly.length, 8)
  assert.equal(insights.weekly.at(-1).providers, 1)
  assert.equal(insights.funnels.providers[1].count, 1)
  assert.ok(insights.events.every(event => !/Hej/.test(event.text)))
})

test('accounts that cannot sign in are internal, not real customers', () => {
  const input = fixture()
  input.users.push(user('seeded', 'customer', daysAgo(120)))
  const insights = buildAdminInsights(input, now)
  const seeded = insights.people.find(person => person.id === 'seeded')
  assert.equal(seeded.internal, true)
  assert.equal(seeded.noLogin, true)
  assert.equal(insights.kpis.externalCustomers, 1)
  assert.match(insights.alerts.map(alert => alert.text).join('\n'), /1 konton saknar fungerande inloggning/)
  assert.equal(insights.externalJobs[0].customerEmail, 'buyer@example.com')
})
