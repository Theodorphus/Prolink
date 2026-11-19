// Raderna i adminens konversationslista. Ren funktion utan databasanrop så
// att den går att testa med node --test.
//
// En offert är en konversation. En förfrågan till en viss frilansare som fått
// en offert visas som den offerten, och läsvyn för den visar förfrågan överst.
// En obesvarad förfrågan har ingen chatt ännu och leder till förfrågans egen
// läsvy, så att kontakter om en tjänst syns redan innan frilansaren svarat.

export function buildConversationRows({ offers, jobs, users, messages, services }) {
  const jobsById = new Map(jobs.map(job => [job.id, job]))
  const namesById = new Map(users.map(user => [user.id, user.name]))
  const serviceTitles = new Map(services.map(service => [service.id, service.title]))
  const nameOf = id => (id && namesById.get(id)) || 'Namnlös'
  const serviceOf = job => ({
    serviceId: job?.service_id ?? null,
    serviceTitle: (job?.service_id && serviceTitles.get(job.service_id)) || null,
  })

  const activity = new Map()
  for (const message of messages) {
    const entry = activity.get(message.offer_id) ?? { count: 0, last: message.created_at }
    entry.count++
    if (message.created_at > entry.last) entry.last = message.created_at
    activity.set(message.offer_id, entry)
  }

  const offerRows = offers.map(offer => {
    const job = jobsById.get(offer.job_id)
    const chat = activity.get(offer.id)
    const inquiry = Boolean(job?.requested_provider_id)
    return {
      id: offer.id,
      href: `/admin/konversation/${offer.id}`,
      inquiry,
      // En förfrågan skickas av kunden, en offert på ett publikt uppdrag av frilansaren.
      from: nameOf(inquiry ? job.customer_id : offer.provider_id),
      to: nameOf(inquiry ? offer.provider_id : job?.customer_id),
      title: job?.title ?? 'Okänt uppdrag',
      ...serviceOf(job),
      offer: { price: offer.price, priceType: offer.price_type, status: offer.status, messages: chat?.count ?? 0 },
      closed: false,
      lastAt: chat && chat.last > offer.created_at ? chat.last : offer.created_at,
    }
  })

  const answered = new Set(offers.map(offer => offer.job_id))
  const waitingRows = jobs.filter(job => job.requested_provider_id && !answered.has(job.id)).map(job => ({
    id: job.id,
    href: `/admin/forfragan/${job.id}`,
    inquiry: true,
    from: nameOf(job.customer_id),
    to: nameOf(job.requested_provider_id),
    title: job.title,
    ...serviceOf(job),
    offer: null,
    closed: job.status === 'closed' || Boolean(job.archived_at),
    lastAt: job.created_at,
  }))

  return [...offerRows, ...waitingRows].sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}

// Sökningen gäller parternas namn, uppdragets titel och tjänstens namn.
export function filterConversationRows(rows, { query = '', inquiriesOnly = false, serviceId = '' } = {}) {
  const needle = query.trim().toLowerCase()
  return rows.filter(row =>
    (!inquiriesOnly || row.inquiry)
    && (!serviceId || row.serviceId === serviceId)
    && (!needle || `${row.from} ${row.to} ${row.title} ${row.serviceTitle ?? ''}`.toLowerCase().includes(needle)))
}
