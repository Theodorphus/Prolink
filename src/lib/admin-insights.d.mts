export interface AdminInsightsInput {
  users: { id: string; role: 'customer' | 'provider'; name: string; bio: string | null; skills: string[] | null; avatar_url: string | null; created_at: string }[]
  authUsers: { id: string; email?: string | null; last_sign_in_at?: string | null; email_confirmed_at?: string | null; app_metadata?: { provider?: string } }[]
  privateProfiles: { user_id: string; email_jobs: boolean; notification_categories: string[] }[]
  jobs: { id: string; customer_id: string; requested_provider_id: string | null; service_id: string | null; title: string; category: string | null; budget: number | null; status: 'open' | 'closed'; archived_at: string | null; created_at: string }[]
  offers: { id: string; job_id: string; provider_id: string; price: number; price_type: 'fixed' | 'hourly'; status: string; customer_read_at: string | null; created_at: string }[]
  messages: { offer_id: string; sender_id: string; created_at: string }[]
  services: { id: string; provider_id: string; title: string; category: string | null; price: number; created_at: string }[]
  reviews: { offer_id: string; reviewer_id: string; reviewee_id: string; rating: number; created_at: string }[]
  outbox: { kind: string; path: string; sent_at: string | null; attempts: number; created_at: string }[]
  internalEmails: string[]
}

export interface AdminPerson {
  id: string
  name: string
  email: string | null
  role: 'customer' | 'provider'
  internal: boolean
  noLogin: boolean
  createdAt: string
  lastSignInAt: string | null
  emailConfirmed: boolean
  signInMethod: 'Google' | 'E-post'
  services: number
  offers: number
  jobs: number
  jobEmails: boolean | null
  categories: string[]
  missing: string[]
}

export interface AdminOffer {
  id: string
  providerId: string
  providerName: string
  providerInternal: boolean
  price: number
  priceType: 'fixed' | 'hourly'
  status: string
  createdAt: string
  customerRead: boolean
  messages: number
}

export interface AdminJob {
  id: string
  title: string
  category: string | null
  budget: number | null
  status: 'open' | 'closed' | 'archived'
  direct: boolean
  createdAt: string
  customerId: string
  customerName: string
  customerEmail: string | null
  requestedProviderName: string | null
  notifiedQueued: number
  notifiedDelivered: number
  providersJoinedAfter: number
  offers: AdminOffer[]
}

export interface AdminAlert {
  level: 'critical' | 'warning' | 'info'
  text: string
}

export interface AdminInsights {
  kpis: {
    externalUsers: number
    externalUsers7d: number
    externalProviders: number
    externalProviders30d: number
    externalCustomers: number
    externalCustomers30d: number
    externalPublicJobs: number
    externalInquiries: number
    internalJobs: number
    realOffers: number
    realOffersOnInternalJobs: number
    realOffersOnExternalJobs: number
    providersWhoOffered: number
    wonDeals: number
    services: number
    realMessages: number
    reviews: number
  }
  alerts: AdminAlert[]
  funnels: { providers: { label: string; count: number }[]; customers: { label: string; count: number }[] }
  categories: { category: string | null; services: number; providers: number; subscribers: number; externalJobs: number; internalJobs: number; offers: number }[]
  weekly: { start: string; customers: number; providers: number; jobs: number; services: number; offers: number; messages: number }[]
  notifications: { sent7d: number; pending: number; failed: number; oldestPending: string | null; retrying: number }
  people: AdminPerson[]
  internalJobs: AdminJob[]
  externalJobs: AdminJob[]
  services: { id: string; title: string; category: string | null; price: number; providerId: string; providerName: string; internal: boolean; createdAt: string; inquiries: number }[]
  events: { at: string; kind: 'user' | 'job' | 'inquiry' | 'offer' | 'service' | 'review' | 'message'; text: string; href: string | null; internal: boolean }[]
}

export function parseEmailList(value: string | undefined | null): string[]
export function buildAdminInsights(input: AdminInsightsInput, now?: number): AdminInsights
