import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAdminInsights, parseEmailList } from '@/lib/admin-insights.mjs'

// Åtkomst styrs av ADMIN_EMAILS (kommaseparerad). INTERNAL_EMAILS märker
// operatörens test- och demokonton som interna utan att ge dem adminåtkomst.
export function adminEmails() {
  return parseEmailList(process.env.ADMIN_EMAILS)
}

export function internalEmails() {
  return [...new Set([...adminEmails(), ...parseEmailList(process.env.INTERNAL_EMAILS)])]
}

// En inloggad användare som inte är admin får 404, så att sidan inte bekräftar
// att den finns. E-postadressen måste vara bekräftad: annars skulle någon kunna
// registrera adminadressen innan den ägs av ett konto.
export async function requireAdmin() {
  const { data: { user } } = await getUser()
  if (!user) redirect('/login?redirect=/admin')
  const email = user.email?.toLowerCase()
  if (!email || !user.email_confirmed_at || !adminEmails().includes(email)) notFound()
  return user
}

// PostgREST returnerar högst 1 000 rader per anrop i Supabase standardinställning,
// så tabeller som kan växa förbi det hämtas sida för sida.
const PAGE = 1000

async function selectAll<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1)
    if (error) throw new Error(`Adminöversikten kunde inte hämtas: ${error.message}`)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

async function listAuthUsers(admin: ReturnType<typeof createAdminClient>) {
  const users = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE })
    if (error) throw new Error(`Kontona kunde inte hämtas: ${error.message}`)
    users.push(...data.users)
    if (data.users.length < PAGE) return users
  }
}

export async function loadAdminInsights() {
  const admin = createAdminClient()
  // Bara de kolumner översikten behöver. Meddelandetext, offertbeskrivningar,
  // telefonnummer och CV hämtas aldrig.
  const [authUsers, users, privateProfiles, jobs, offers, messages, services, reviews, outbox] = await Promise.all([
    listAuthUsers(admin),
    selectAll((from, to) => admin.from('users').select('id, role, name, bio, skills, avatar_url, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => admin.from('user_private_profiles').select('user_id, email_jobs, notification_categories').order('user_id').range(from, to)),
    selectAll((from, to) => admin.from('jobs').select('id, customer_id, requested_provider_id, service_id, title, category, budget, status, archived_at, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => admin.from('offers').select('id, job_id, provider_id, price, price_type, status, customer_read_at, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => admin.from('messages').select('offer_id, sender_id, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => admin.from('services').select('id, provider_id, title, category, price, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => admin.from('reviews').select('offer_id, reviewer_id, reviewee_id, rating, created_at').order('created_at').range(from, to)),
    selectAll((from, to) => admin.from('notification_outbox').select('kind, path, sent_at, attempts, created_at').order('created_at').range(from, to)),
  ])

  return buildAdminInsights({
    authUsers, users, privateProfiles, jobs, offers, messages, services, reviews, outbox,
    internalEmails: internalEmails(),
  })
}
