import { Resend } from 'resend'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/site'
import { DEFAULT_LOCALE, htmlLang, localePath, type Locale } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'

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
export async function sendQueuedNotification(item: { id: string; kind: string; to: string; subject: string; body: string; path: string; locale?: Locale }) {
  const locale = item.locale ?? DEFAULT_LOCALE
  const t = createT(locale, messagesFor(locale))
  // Rubriker som SQL-triggrarna skriver är fasta svenska fraser; de översätts
  // här med mottagarens språk. Text som inte finns i ordlistan lämnas orörd.
  const subject = t(item.subject)
  const body = t(item.body)
  const problem = emailConfigurationProblem()
  if (problem) throw new Error(problem)
  const reference = item.kind === 'reference'
  const admin = item.kind === 'admin_verification'
  const welcome = item.kind === 'welcome'
  const verification = item.kind === 'verification_result'
  const validPath = reference ? /^\/referens\/[A-Za-z0-9_-]{32,}$/
    : admin ? /^\/admin$/
    : welcome ? /^\/(profile\/[0-9a-f-]+|jobs\/create)$/i
    : verification ? /^\/profile\/[0-9a-f-]+$/i
    : /^\/(jobs|offers|messages)\/[0-9a-f-]+$/i
  if (!validPath.test(item.path)) throw new Error('Invalid notification path')
  // Mottagaren av en referensförfrågan har inget konto och inga inställningar.
  const action = reference ? t('Lämna ditt omdöme') : admin ? t('Öppna adminpanelen') : welcome ? t('Kom igång') : verification ? t('Se din profil') : t('Öppna i Prolink')
  const footer = reference
    ? t('Du får det här mejlet för att en frilansare angett dig som tidigare kund. Känner du inte igen det kan du ignorera mejlet.')
    : admin
      ? t('Du får det här mejlet som administratör för Prolink.')
      : welcome
        ? t('Du får det här mejlet för att du skapade ett konto på Prolink.')
        : verification
          ? t('Du får det här mejlet för att du ansökt om företagsverifiering på Prolink.')
          : t('Ändra mejlnotiser i din profil.')
  const result = await resend.emails.send({
    // Svar går till en adress som läses, eftersom avsändaren är en noreply-adress.
    from: FROM, replyTo: CONTACT_EMAIL, to: item.to, subject: safeSubjectValue(subject),
    html: `<div lang="${htmlLang(locale)}"><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(body).replace(/\n/g, '<br>')}</p><p><a href="${escapeHtml(APP_URL + localePath(locale, item.path))}">${action}</a></p><p>${footer}</p></div>`,
    text: `${subject}\n${body}\n${APP_URL + localePath(locale, item.path)}\n${footer}`,
  }, { idempotencyKey: `notification/${item.id}` })
  if (result.error) throw new Error(`Resend nekade utskicket: ${result.error.message ?? 'okänt fel'}`)
}
