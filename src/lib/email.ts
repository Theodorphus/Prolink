import { Resend } from 'resend'
import { SITE_URL } from '@/lib/site'

const resend = new Resend(process.env.RESEND_API_KEY)

// RESEND_FROM_EMAIL måste peka på en avsändare vars domän är verifierad i
// Resend. Saknas den föll koden tidigare tillbaka på noreply@prolink.se, som
// inte är verifierad, så varje utskick returnerade 403. Anroparna sväljer
// felet med avsikt (ett mejlavbrott får inte stoppa offertflödet), vilket
// gjorde att felet aldrig syntes någonstans. Därför loggas felkonfigurationen
// uttryckligen här i stället.
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

// Resend kastar inte vid HTTP-fel, utan returnerar { data, error }. Utan den
// här kontrollen såg ett nekat utskick (t.ex. 403 för overifierad domän) ut
// som ett lyckat anrop, och anroparnas try/catch fångade ingenting.
async function send(payload: Parameters<typeof resend.emails.send>[0]) {
  const problem = emailConfigurationProblem()
  if (problem) throw new Error(problem)

  const result = await resend.emails.send(payload)
  if (result.error) {
    throw new Error(`Resend nekade utskicket: ${result.error.message ?? 'okänt fel'}`)
  }
  return result
}

export async function sendNewOfferEmail({
  to,
  jobTitle,
  providerName,
  offerId,
}: {
  to: string
  jobTitle: string
  providerName: string
  offerId: string
}) {
  const safeJobTitle = escapeHtml(jobTitle)
  const safeProviderName = escapeHtml(providerName)

  return send({
    from: FROM,
    to,
    subject: `Ny offert på "${safeSubjectValue(jobTitle)}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Ny offert mottagen</h2>
        <p>${safeProviderName} har skickat en offert på ditt uppdrag <strong>${safeJobTitle}</strong>.</p>
        <a href="${APP_URL}/offers/${offerId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1d4ed8;color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Se offerten
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:14px">Prolink — Kopplar ihop kunder och leverantörer i Sverige</p>
      </div>
    `,
  })
}

export async function sendOfferAcceptedEmail({
  to,
  jobTitle,
  offerId,
}: {
  to: string
  jobTitle: string
  offerId: string
}) {
  const safeJobTitle = escapeHtml(jobTitle)

  return send({
    from: FROM,
    to,
    subject: `Din offert på "${safeSubjectValue(jobTitle)}" accepterades!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">Grattis — din offert accepterades!</h2>
        <p>Kunden har accepterat din offert på uppdraget <strong>${safeJobTitle}</strong>.</p>
        <p>Starta chatten och kom överens om nästa steg.</p>
        <a href="${APP_URL}/messages/${offerId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#16a34a;color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Öppna chatten
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:14px">Prolink — Kopplar ihop kunder och leverantörer i Sverige</p>
      </div>
    `,
  })
}

export async function sendNewMessageEmail({
  to,
  senderName,
  jobTitle,
  offerId,
}: {
  to: string
  senderName: string
  jobTitle: string
  offerId: string
}) {
  const safeSenderName = escapeHtml(senderName)
  const safeJobTitle = escapeHtml(jobTitle)

  return send({
    from: FROM,
    to,
    subject: `Nytt meddelande från ${safeSubjectValue(senderName)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Nytt meddelande</h2>
        <p><strong>${safeSenderName}</strong> har skickat ett meddelande angående uppdraget <strong>${safeJobTitle}</strong>.</p>
        <a href="${APP_URL}/messages/${offerId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1d4ed8;color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Svara
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:14px">Prolink — Kopplar ihop kunder och leverantörer i Sverige</p>
      </div>
    `,
  })
}

// Marknadsplatsen saknade helt en notis åt utbudshållet: när en kund
// publicerade ett uppdrag hände ingenting hos leverantörerna, som själva
// fick komma ihåg att besöka /jobs. Det här mejlet stänger den luckan.
export async function sendNewJobEmail({
  to,
  jobTitle,
  categoryLabel,
  budget,
  jobId,
}: {
  to: string
  jobTitle: string
  categoryLabel: string
  budget: number | null
  jobId: string
}) {
  const safeJobTitle = escapeHtml(jobTitle)
  const safeCategory = escapeHtml(categoryLabel)
  const budgetRow = budget
    ? `<p style="margin:4px 0;color:#475569">Budget: <strong>${budget.toLocaleString('sv-SE')} kr</strong></p>`
    : ''

  return send({
    from: FROM,
    to,
    subject: `Nytt uppdrag: ${safeSubjectValue(jobTitle)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Nytt uppdrag inom ${safeCategory}</h2>
        <p><strong>${safeJobTitle}</strong> har publicerats och är öppet för offerter.</p>
        ${budgetRow}
        <a href="${APP_URL}/jobs/${jobId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1d4ed8;color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Se uppdraget
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:14px">Du får det här mejlet för att du är registrerad som leverantör på Prolink.</p>
      </div>
    `,
  })
}
