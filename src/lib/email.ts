import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Prolink <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Ny offert på "${jobTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Ny offert mottagen</h2>
        <p>${providerName} har skickat en offert på ditt uppdrag <strong>${jobTitle}</strong>.</p>
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
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Din offert på "${jobTitle}" accepterades!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">Grattis — din offert accepterades!</h2>
        <p>Kunden har accepterat din offert på uppdraget <strong>${jobTitle}</strong>.</p>
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
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Nytt meddelande från ${senderName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Nytt meddelande</h2>
        <p><strong>${senderName}</strong> har skickat ett meddelande angående uppdraget <strong>${jobTitle}</strong>.</p>
        <a href="${APP_URL}/messages/${offerId}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1d4ed8;color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Svara
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:14px">Prolink — Kopplar ihop kunder och leverantörer i Sverige</p>
      </div>
    `,
  })
}
