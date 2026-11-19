import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildConversationRows, filterConversationRows } from '../src/lib/admin-conversations.mjs'

function fixture() {
  return {
    users: [{ id: 'buyer', name: 'Kund' }, { id: 'pro', name: 'Frilansare' }, { id: 'other', name: 'Annan' }],
    services: [{ id: 'svc', title: 'Hemsida' }],
    jobs: [
      { id: 'public', title: 'Publikt uppdrag', customer_id: 'buyer', requested_provider_id: null, service_id: null, status: 'open', archived_at: null, created_at: '2026-10-01T10:00:00Z' },
      { id: 'answered', title: 'Besvarad förfrågan', customer_id: 'buyer', requested_provider_id: 'pro', service_id: 'svc', status: 'open', archived_at: null, created_at: '2026-10-02T10:00:00Z' },
      { id: 'waiting', title: 'Obesvarad förfrågan', customer_id: 'buyer', requested_provider_id: 'pro', service_id: 'svc', status: 'open', archived_at: null, created_at: '2026-10-05T10:00:00Z' },
      { id: 'closed', title: 'Från profilen', customer_id: 'buyer', requested_provider_id: 'other', service_id: null, status: 'closed', archived_at: null, created_at: '2026-10-03T10:00:00Z' },
    ],
    offers: [
      { id: 'o-public', job_id: 'public', provider_id: 'other', price: 1000, price_type: 'fixed', status: 'pending', created_at: '2026-10-01T12:00:00Z' },
      { id: 'o-answered', job_id: 'answered', provider_id: 'pro', price: 2000, price_type: 'hourly', status: 'accepted', created_at: '2026-10-02T12:00:00Z' },
    ],
    messages: [
      { offer_id: 'o-answered', created_at: '2026-10-06T09:00:00Z' },
      { offer_id: 'o-answered', created_at: '2026-10-04T09:00:00Z' },
    ],
  }
}

test('obesvarade förfrågningar blir egna rader, besvarade visas som sin offert', () => {
  const rows = buildConversationRows(fixture())
  assert.deepEqual(rows.map(row => row.id), ['o-answered', 'waiting', 'closed', 'o-public'])

  const answered = rows.find(row => row.id === 'o-answered')
  assert.equal(answered.href, '/admin/konversation/o-answered')
  assert.deepEqual([answered.inquiry, answered.from, answered.to, answered.serviceTitle], [true, 'Kund', 'Frilansare', 'Hemsida'])
  assert.equal(answered.offer.messages, 2)
  assert.equal(answered.lastAt, '2026-10-06T09:00:00Z')

  const waiting = rows.find(row => row.id === 'waiting')
  assert.equal(waiting.href, '/admin/forfragan/waiting')
  assert.equal(waiting.offer, null)
  assert.equal(waiting.closed, false)
  assert.equal(rows.find(row => row.id === 'closed').closed, true)

  const offer = rows.find(row => row.id === 'o-public')
  assert.deepEqual([offer.inquiry, offer.from, offer.to, offer.serviceTitle], [false, 'Annan', 'Kund', null])
})

test('filtren visar förfrågningar, en tjänsts förfrågningar och söker på tjänstens namn', () => {
  const rows = buildConversationRows(fixture())
  assert.deepEqual(filterConversationRows(rows, { inquiriesOnly: true }).map(row => row.id), ['o-answered', 'waiting', 'closed'])
  assert.deepEqual(filterConversationRows(rows, { serviceId: 'svc' }).map(row => row.id), ['o-answered', 'waiting'])
  assert.deepEqual(filterConversationRows(rows, { query: '  HEMSIDA ' }).map(row => row.id), ['o-answered', 'waiting'])
  assert.equal(filterConversationRows(rows).length, 4)
})

test('en borttagen tjänst ger ingen titel', () => {
  const input = fixture()
  input.services = []
  const waiting = buildConversationRows(input).find(row => row.id === 'waiting')
  assert.equal(waiting.serviceId, 'svc')
  assert.equal(waiting.serviceTitle, null)
})
