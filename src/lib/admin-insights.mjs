// Beräknar adminöversikten ur råa rader. Ren funktion utan databasanrop så
// att siffrorna går att testa med node --test.
//
// "Interna" konton är operatörens egna (ADMIN_EMAILS och INTERNAL_EMAILS).
// Deras uppdrag och registreringar räknas inte som riktig efterfrågan, men
// offerter som riktiga frilansare skickar på dem räknas som riktigt intresse.

const DAY = 86_400_000
const WON = new Set(['accepted', 'delivered', 'completed'])

export function parseEmailList(value) {
  return (value ?? '').split(/[,;\s]+/).map(email => email.trim().toLowerCase()).filter(Boolean)
}

function countBy(rows, key) {
  const counts = new Map()
  for (const row of rows) {
    const value = key(row)
    if (value == null) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return counts
}

function within(date, now, days) {
  const time = Date.parse(date)
  return Number.isFinite(time) && now - time <= days * DAY
}

// Måndag 00:00 UTC för veckan som innehåller tidpunkten.
function weekStart(time) {
  const date = new Date(time)
  const day = (date.getUTCDay() + 6) % 7
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day)
}

export function buildAdminInsights(input, now = Date.now()) {
  const { users, authUsers, privateProfiles, jobs, offers, messages, services, reviews, outbox, internalEmails } = input
  const internal = new Set(internalEmails.map(email => email.toLowerCase()))
  const authById = new Map(authUsers.map(user => [user.id, user]))
  const usersById = new Map(users.map(user => [user.id, user]))
  const jobsById = new Map(jobs.map(job => [job.id, job]))
  const offersById = new Map(offers.map(offer => [offer.id, offer]))
  // Ett konto som Supabase Auth inte kan läsa in (t.ex. skapat direkt med SQL
  // som seed-data) kan inte logga in och är därför inte en riktig användare.
  const isInternal = id => !authById.has(id) || internal.has((authById.get(id)?.email ?? '').toLowerCase())
  const nameOf = id => usersById.get(id)?.name || 'Namnlös'

  const servicesByProvider = countBy(services, service => service.provider_id)
  const offersByProvider = countBy(offers, offer => offer.provider_id)
  const jobsByCustomer = countBy(jobs, job => job.customer_id)
  const offersByJob = new Map()
  for (const offer of offers) offersByJob.set(offer.job_id, [...(offersByJob.get(offer.job_id) ?? []), offer])
  const messagesByOffer = countBy(messages, message => message.offer_id)
  const inquiriesByService = countBy(jobs, job => job.service_id)
  const jobNotifications = new Map()
  for (const item of outbox) {
    if (item.kind !== 'job' && item.kind !== 'inquiry') continue
    const id = item.path.split('/').pop()
    const entry = jobNotifications.get(id) ?? { queued: 0, delivered: 0 }
    entry.queued++
    if (item.sent_at) entry.delivered++
    jobNotifications.set(id, entry)
  }
  const profiles = new Map(privateProfiles.map(profile => [profile.user_id, profile]))

  const people = users.map(user => {
    const auth = authById.get(user.id)
    const missing = []
    if (!user.avatar_url) missing.push('profilbild')
    if (!user.bio?.trim()) missing.push('beskrivning')
    if (user.role === 'provider' && !user.skills?.length) missing.push('kompetenser')
    if (user.role === 'provider' && !servicesByProvider.get(user.id)) missing.push('tjänst')
    const profile = profiles.get(user.id)
    return {
      id: user.id,
      name: user.name || 'Namnlös',
      email: auth?.email ?? null,
      role: user.role,
      internal: isInternal(user.id),
      noLogin: !auth,
      createdAt: user.created_at,
      lastSignInAt: auth?.last_sign_in_at ?? null,
      emailConfirmed: Boolean(auth?.email_confirmed_at),
      signInMethod: auth?.app_metadata?.provider === 'google' ? 'Google' : 'E-post',
      services: servicesByProvider.get(user.id) ?? 0,
      offers: offersByProvider.get(user.id) ?? 0,
      jobs: jobsByCustomer.get(user.id) ?? 0,
      jobEmails: user.role === 'provider' ? (profile?.email_jobs ?? true) : null,
      categories: profile?.notification_categories ?? [],
      missing,
    }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const external = people.filter(person => !person.internal)
  const externalCustomers = external.filter(person => person.role === 'customer')
  const externalProviders = external.filter(person => person.role === 'provider')

  const describeJob = job => {
    const jobOffers = (offersByJob.get(job.id) ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at))
    const notified = jobNotifications.get(job.id) ?? { queued: 0, delivered: 0 }
    // Mejlet om ett publikt uppdrag går bara till frilansare som fanns när det
    // skapades. De som registrerat sig efteråt har aldrig aviserats.
    const providersJoinedAfter = job.requested_provider_id ? 0
      : externalProviders.filter(person => Date.parse(person.createdAt) > Date.parse(job.created_at) && person.id !== job.customer_id).length
    return {
      id: job.id,
      title: job.title,
      category: job.category,
      budget: job.budget,
      status: job.archived_at ? 'archived' : job.status,
      direct: Boolean(job.requested_provider_id),
      createdAt: job.created_at,
      customerId: job.customer_id,
      customerName: nameOf(job.customer_id),
      customerEmail: authById.get(job.customer_id)?.email ?? null,
      requestedProviderName: job.requested_provider_id ? nameOf(job.requested_provider_id) : null,
      notifiedQueued: notified.queued,
      notifiedDelivered: notified.delivered,
      providersJoinedAfter,
      offers: jobOffers.map(offer => ({
        id: offer.id,
        providerId: offer.provider_id,
        providerName: nameOf(offer.provider_id),
        providerInternal: isInternal(offer.provider_id),
        price: offer.price,
        priceType: offer.price_type,
        status: offer.status,
        createdAt: offer.created_at,
        customerRead: Boolean(offer.customer_read_at),
        messages: messagesByOffer.get(offer.id) ?? 0,
      })),
    }
  }
  const allJobs = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(describeJob)
  const internalJobs = allJobs.filter(job => isInternal(job.customerId))
  const externalJobs = allJobs.filter(job => !isInternal(job.customerId))

  const realOffers = offers.filter(offer => !isInternal(offer.provider_id))
  const realOffersOnInternalJobs = realOffers.filter(offer => isInternal(jobsById.get(offer.job_id)?.customer_id))
  const realOffersOnExternalJobs = realOffers.filter(offer => !isInternal(jobsById.get(offer.job_id)?.customer_id))
  const realMessages = messages.filter(message => !isInternal(message.sender_id))
  const externalPublicJobs = externalJobs.filter(job => !job.direct)
  const externalInquiries = externalJobs.filter(job => job.direct)

  const kpis = {
    externalUsers: external.length,
    externalUsers7d: external.filter(person => within(person.createdAt, now, 7)).length,
    externalProviders: externalProviders.length,
    externalProviders30d: externalProviders.filter(person => within(person.createdAt, now, 30)).length,
    externalCustomers: externalCustomers.length,
    externalCustomers30d: externalCustomers.filter(person => within(person.createdAt, now, 30)).length,
    externalPublicJobs: externalPublicJobs.length,
    externalInquiries: externalInquiries.length,
    internalJobs: internalJobs.length,
    realOffers: realOffers.length,
    realOffersOnInternalJobs: realOffersOnInternalJobs.length,
    realOffersOnExternalJobs: realOffersOnExternalJobs.length,
    providersWhoOffered: new Set(realOffers.map(offer => offer.provider_id)).size,
    wonDeals: offers.filter(offer => WON.has(offer.status) && !isInternal(jobsById.get(offer.job_id)?.customer_id)).length,
    services: services.filter(service => !isInternal(service.provider_id)).length,
    realMessages: realMessages.length,
    reviews: reviews.length,
  }

  // Trattar. Varje steg är en delmängd av föregående.
  const providerSteps = [
    ['Registrerade frilansare', externalProviders],
    ['Har publicerat en tjänst', externalProviders.filter(person => person.services > 0)],
    ['Har skickat en offert', externalProviders.filter(person => person.offers > 0)],
    ['Har vunnit ett uppdrag', externalProviders.filter(person => offers.some(offer => offer.provider_id === person.id && WON.has(offer.status)))],
  ]
  const customerSteps = [
    ['Uppdrag och förfrågningar', externalJobs],
    ['Har fått minst en offert', externalJobs.filter(job => job.offers.length > 0)],
    ['Offert accepterad', externalJobs.filter(job => job.offers.some(offer => WON.has(offer.status)))],
    ['Slutförd', externalJobs.filter(job => job.offers.some(offer => offer.status === 'completed'))],
    ['Recenserad', externalJobs.filter(job => job.offers.some(offer => reviews.some(review => review.offer_id === offer.id)))],
  ]
  const funnels = {
    providers: providerSteps.map(([label, rows]) => ({ label, count: rows.length })),
    customers: customerSteps.map(([label, rows]) => ({ label, count: rows.length })),
  }

  // Utbud och efterfrågan per kategori.
  const categoryKeys = new Set([...services.map(s => s.category), ...jobs.map(j => j.category), ...people.flatMap(p => p.categories)])
  const categories = [...categoryKeys].map(category => {
    const providerIds = new Set(services.filter(s => s.category === category && !isInternal(s.provider_id)).map(s => s.provider_id))
    return {
      category,
      services: services.filter(s => s.category === category && !isInternal(s.provider_id)).length,
      providers: providerIds.size,
      subscribers: externalProviders.filter(p => p.jobEmails && (p.categories.length === 0 || p.categories.includes(category))).length,
      externalJobs: externalJobs.filter(j => j.category === category).length,
      internalJobs: internalJobs.filter(j => j.category === category).length,
      offers: realOffers.filter(o => jobsById.get(o.job_id)?.category === category).length,
    }
  }).sort((a, b) => (b.services + b.externalJobs + b.internalJobs) - (a.services + a.externalJobs + a.internalJobs))

  // Veckovis aktivitet, de senaste åtta veckorna, utan interna konton.
  const currentWeek = weekStart(now)
  const weeks = Array.from({ length: 8 }, (_, index) => currentWeek - (7 - index) * 7 * DAY)
  const weekOf = date => weekStart(Date.parse(date))
  const weekly = weeks.map(start => ({
    start: new Date(start).toISOString(),
    customers: externalCustomers.filter(p => weekOf(p.createdAt) === start).length,
    providers: externalProviders.filter(p => weekOf(p.createdAt) === start).length,
    jobs: externalJobs.filter(j => weekOf(j.createdAt) === start).length,
    services: services.filter(s => !isInternal(s.provider_id) && weekOf(s.created_at) === start).length,
    offers: realOffers.filter(o => weekOf(o.created_at) === start).length,
    messages: realMessages.filter(m => weekOf(m.created_at) === start).length,
  }))

  const serviceRows = services.map(service => ({
    id: service.id,
    title: service.title,
    category: service.category,
    price: service.price,
    providerId: service.provider_id,
    providerName: nameOf(service.provider_id),
    internal: isInternal(service.provider_id),
    createdAt: service.created_at,
    inquiries: inquiriesByService.get(service.id) ?? 0,
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Händelselogg. Meddelandens innehåll lämnas medvetet utanför.
  const events = [
    ...people.map(p => ({ at: p.createdAt, kind: 'user', text: `${p.name} registrerade sig som ${p.role === 'customer' ? 'köpare' : 'frilansare'}`, href: `/profile/${p.id}`, internal: p.internal })),
    ...allJobs.map(j => ({ at: j.createdAt, kind: j.direct ? 'inquiry' : 'job', text: j.direct ? `${j.customerName} skickade en förfrågan till ${j.requestedProviderName}: ${j.title}` : `${j.customerName} publicerade uppdraget ${j.title}`, href: `/jobs/${j.id}`, internal: isInternal(j.customerId) })),
    ...offers.map(o => ({ at: o.created_at, kind: 'offer', text: `${nameOf(o.provider_id)} skickade en offert på ${jobsById.get(o.job_id)?.title ?? 'ett uppdrag'}`, href: `/jobs/${o.job_id}`, internal: isInternal(o.provider_id) })),
    ...serviceRows.map(s => ({ at: s.createdAt, kind: 'service', text: `${s.providerName} publicerade tjänsten ${s.title}`, href: `/services/${s.id}`, internal: s.internal })),
    ...reviews.map(r => ({ at: r.created_at, kind: 'review', text: `${nameOf(r.reviewer_id)} gav ${nameOf(r.reviewee_id)} ${r.rating}/5`, href: `/profile/${r.reviewee_id}`, internal: isInternal(r.reviewer_id) })),
    ...summariseConversations(messages, offersById, jobsById, nameOf, isInternal),
  ].filter(event => event.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60)

  const failedNotifications = outbox.filter(item => !item.sent_at && item.attempts >= 8)
  const pendingNotifications = outbox.filter(item => !item.sent_at && item.attempts < 8)
  const notifications = {
    sent7d: outbox.filter(item => item.sent_at && within(item.sent_at, now, 7)).length,
    pending: pendingNotifications.length,
    failed: failedNotifications.length,
    oldestPending: pendingNotifications.map(item => item.created_at).sort()[0] ?? null,
    retrying: pendingNotifications.filter(item => item.attempts > 0).length,
  }

  // Det som kräver uppmärksamhet, i prioritetsordning.
  const alerts = []
  if (notifications.failed > 0) alerts.push({ level: 'critical', text: `${notifications.failed} mejlnotiser har misslyckats åtta gånger och skickas inte längre. Kontrollera Resend och avsändardomänen.` })
  if (notifications.retrying > 0) alerts.push({ level: 'warning', text: `${notifications.retrying} mejlnotiser har misslyckats minst en gång och försöks igen.` })
  const unanswered = externalJobs.filter(j => j.status === 'open' && j.offers.length === 0 && !within(j.createdAt, now, 2))
  if (unanswered.length) alerts.push({ level: 'critical', text: `${unanswered.length} uppdrag eller förfrågningar från riktiga kunder har väntat mer än två dygn utan offert.` })
  const unreadOffers = externalJobs.flatMap(j => j.offers).filter(o => o.status === 'pending' && !o.customerRead && !within(o.createdAt, now, 3))
  if (unreadOffers.length) alerts.push({ level: 'warning', text: `${unreadOffers.length} offerter har inte öppnats av kunden på över tre dagar.` })
  if (kpis.externalCustomers30d === 0 && kpis.externalProviders30d > 0) alerts.push({ level: 'warning', text: `Inga nya uppdragsgivare de senaste 30 dagarna, men ${kpis.externalProviders30d} nya frilansare. Utbudet växer utan efterfrågan.` })
  const notNotified = internalJobs.filter(j => !j.direct && j.status === 'open' && j.providersJoinedAfter > 0)
  if (notNotified.length) alerts.push({ level: 'info', text: `${notNotified.length} av dina öppna uppdrag skapades innan några av frilansarna registrerade sig. De har aldrig fått mejl om dem, eftersom uppdragsmejlet bara skickas när uppdraget publiceras.` })
  const noLogin = people.filter(p => p.noLogin)
  if (noLogin.length) alerts.push({ level: 'info', text: `${noLogin.length} konton saknar fungerande inloggning (troligen skapade direkt i databasen) och räknas som interna.` })
  const unconfirmed = external.filter(p => !p.emailConfirmed)
  if (unconfirmed.length) alerts.push({ level: 'warning', text: `${unconfirmed.length} konton har inte bekräftat sin e-postadress och kan inte logga in.` })
  const noService = externalProviders.filter(p => p.services === 0)
  if (noService.length) alerts.push({ level: 'info', text: `${noService.length} frilansare har inte publicerat någon tjänst ännu.` })
  const optedOut = externalProviders.filter(p => p.jobEmails === false)
  if (optedOut.length) alerts.push({ level: 'info', text: `${optedOut.length} frilansare har stängt av mejl om nya uppdrag.` })

  return {
    kpis, alerts, funnels, categories, weekly, notifications,
    people, internalJobs, externalJobs, services: serviceRows, events,
  }
}

// Ett meddelande per händelse skulle dränka loggen, så meddelanden slås ihop
// per konversation och dag.
function summariseConversations(messages, offersById, jobsById, nameOf, isInternal) {
  const groups = new Map()
  for (const message of messages) {
    const key = `${message.offer_id}:${message.created_at.slice(0, 10)}`
    const group = groups.get(key) ?? { offerId: message.offer_id, at: message.created_at, count: 0, senders: new Set() }
    group.count++
    if (message.created_at > group.at) group.at = message.created_at
    group.senders.add(message.sender_id)
    groups.set(key, group)
  }
  return [...groups.values()].map(group => {
    const offer = offersById.get(group.offerId)
    const job = offer && jobsById.get(offer.job_id)
    const participants = offer && job ? `${nameOf(job.customer_id)} och ${nameOf(offer.provider_id)}` : 'okända parter'
    return {
      at: group.at,
      kind: 'message',
      text: `${group.count} ${group.count === 1 ? 'meddelande' : 'meddelanden'} mellan ${participants}${job ? ` om ${job.title}` : ''}`,
      href: null,
      internal: [...group.senders].every(isInternal),
    }
  })
}
