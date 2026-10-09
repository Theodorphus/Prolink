import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOrgNumber, referenceEmailProblem, normalizeWebsite, websiteLabel } from '../src/lib/trust.mjs'

test('organisationsnummer kontrolleras med Luhn och normaliseras', () => {
  assert.equal(normalizeOrgNumber('556036-0793'), '5560360793')
  assert.equal(normalizeOrgNumber('165560360793'), '5560360793')
  assert.equal(normalizeOrgNumber('19811218-9876'), '8112189876')
  assert.equal(normalizeOrgNumber('556036-0794'), null)
  assert.equal(normalizeOrgNumber('55603607'), null)
  assert.equal(normalizeOrgNumber('abc'), null)
})

test('referenser kan inte begäras från den egna adressen eller företagsdomänen', () => {
  assert.equal(referenceEmailProblem('kund@foretag.se', 'jag@byra.se'), null)
  assert.match(referenceEmailProblem('Jag@Byra.se', 'jag@byra.se'), /dig själv/)
  assert.match(referenceEmailProblem('kollega@byra.se', 'jag@byra.se'), /samma domän/)
  assert.equal(referenceEmailProblem('kund@gmail.com', 'jag@gmail.com'), null)
  assert.match(referenceEmailProblem('inte-en-adress', 'jag@byra.se'), /giltig/)
})

test('hemsidan godtas utan protokoll men inte med andra protokoll', () => {
  assert.equal(normalizeWebsite('noemo.se'), 'https://noemo.se/')
  assert.equal(normalizeWebsite(' https://www.noemo.se/portfolio '), 'https://www.noemo.se/portfolio')
  assert.equal(normalizeWebsite(''), null)
  assert.equal(normalizeWebsite('javascript:alert(1)'), undefined)
  assert.equal(normalizeWebsite('hej'), undefined)
  assert.equal(websiteLabel('https://www.noemo.se/portfolio/'), 'noemo.se/portfolio')
})

import { profileCompleteness, responseTimeLabel } from '../src/lib/trust.mjs'

test('profilens fullständighet räknar stegen och listar det som saknas', () => {
  const empty = { avatar_url: null, bio: 'Hej', skills: ['A'], location: null, work_mode: null, website_url: null, linkedin_url: null, services: 0, portfolio: 0, companySubmitted: false, referencesRequested: 0 }
  assert.equal(profileCompleteness(empty).percent, 0)
  assert.equal(profileCompleteness(empty).missing[0].key, 'avatar')
  const full = { ...empty, avatar_url: 'x', bio: 'x'.repeat(150), skills: ['A', 'B', 'C'], location: 'Göteborg', work_mode: 'hybrid', website_url: 'https://a.se', services: 1, portfolio: 1, companySubmitted: true, referencesRequested: 1 }
  assert.deepEqual(profileCompleteness(full), { percent: 100, missing: [] })
})

test('svarstiden kräver underlag och avrundas grovt', () => {
  assert.equal(responseTimeLabel(0.5, 2), null)
  assert.equal(responseTimeLabel(0.5, 3), 'Svarar oftast inom en timme')
  assert.equal(responseTimeLabel(3, 5), 'Svarar oftast inom några timmar')
  assert.equal(responseTimeLabel(20, 5), 'Svarar oftast inom ett dygn')
  assert.equal(responseTimeLabel(200, 5), null)
})
