import { Resend } from 'resend'
import { SITE_URL } from '@/lib/site'

const resend = new Resend(process.env.RESEND_API_KEY)

// RESEND_FROM_EMAIL måste peka på en avsändare vars domän är verifierad i
// Resend. Saknas den föll koden tidigare tillbaka på noreply@prolink.se, som
// inte är verifierad, så varje utskick returnerade 403 utan att felet syntes
// någonstans. Därför loggas felkonfigurationen uttryckligen här i stället.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL?.trim()
const FROM = `Prolink <${FROM_ADDRESS ?? 'noreply@prolink.se'}>`
const APP_URL = SITE_URL

export function emailConfigurationProblem(): string | null {
  if (!process.env.RESEND_API_KEY) return 'RESEND_API_KEY saknas — inga mejl kan skickas.'
  if (!FROM_ADDRESS) {
    return 'RESEND_FROM_EMAIL saknas — reservavsändaren noreply@prolink.se är inte verifierad i Resend, så utskick kommer att nekas med 403.'
  }
  return null
}

const configurationProblem = emailConfigurationProblem()
if (configurationProblem) {
  console.error(`[e-post] Felkonfiguration: ${configurationProblem}`)
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]!)
}

function safeSubjectValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 160)
}

// Alla mejl går genom notiskön (notification_outbox) och skickas härifrån av
// cron-rutten. Resend kastar inte vid HTTP-fel utan returnerar { data, error },
// så svaret måste kontrolleras: annars ser ett nekat utskick (t.ex. 403 för
// overifierad domän) ut som ett lyckat, och kön markerar det som skickat.
export async function sendQueuedNotification(item: { id: string; kind: string; to: string; subject: string; body: string; path: string }) {
  const problem = emailConfigurationProblem()
  if (problem) throw new Error(problem)
  const reference = item.kind === 'reference'
  const validPath = reference ? /^\/referens\/[A-Za-z0-9_-]{32,}$/ : /^\/(jobs|offers|messages)\/[0-9a-f-]+$/i
  if (!validPath.test(item.path)) throw new Error('Invalid notification path')
  // Mottagaren av en referensförfrågan har inget konto och inga inställningar.
  const action = reference ? 'Lämna ditt omdöme' : 'Öppna i Prolink'
  const footer = reference
    ? 'Du får det här mejlet för att en frilansare angett dig som tidigare kund. Känner du inte igen det kan du ignorera mejlet.'
    : 'Ändra mejlnotiser i din profil.'
  const result = await resend.emails.send({
    from: FROM, to: item.to, subject: safeSubjectValue(item.subject),
    html: `<h2>${escapeHtml(item.subject)}</h2><p>${escapeHtml(item.body)}</p><p><a href="${escapeHtml(APP_URL + item.path)}">${action}</a></p><p>${footer}</p>`,
    text: `${item.subject}\n${item.body}\n${APP_URL + item.path}\n${footer}`,
  }, { idempotencyKey: `notification/${item.id}` })
  if (result.error) throw new Error(`Resend nekade utskicket: ${result.error.message ?? 'okänt fel'}`)
}
