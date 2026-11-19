export interface ConversationRowsInput {
  offers: { id: string; job_id: string; provider_id: string; price: number; price_type: 'fixed' | 'hourly'; status: string; created_at: string }[]
  jobs: { id: string; title: string; customer_id: string; requested_provider_id: string | null; service_id: string | null; status: 'open' | 'closed'; archived_at: string | null; created_at: string }[]
  users: { id: string; name: string | null }[]
  messages: { offer_id: string; created_at: string }[]
  services: { id: string; title: string }[]
}

export interface ConversationRow {
  id: string
  href: string
  /** Startade som en förfrågan till en viss frilansare, via en tjänst eller profilen. */
  inquiry: boolean
  from: string
  to: string
  title: string
  serviceId: string | null
  serviceTitle: string | null
  /** null för en förfrågan som inte fått någon offert ännu. */
  offer: { price: number; priceType: 'fixed' | 'hourly'; status: string; messages: number } | null
  /** En obesvarad förfrågan som stängts eller arkiverats. */
  closed: boolean
  lastAt: string
}

export function buildConversationRows(input: ConversationRowsInput): ConversationRow[]
export function filterConversationRows(rows: ConversationRow[], filter?: { query?: string; inquiriesOnly?: boolean; serviceId?: string }): ConversationRow[]
