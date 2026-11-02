// Innehåll för mejl som formuleras först när de skickas, så att de speglar
// kontots läge då och inte när raden köades. Texterna skrivs på svenska och
// översätts med mottagarens språk.
import type { TFunction } from '@/i18n/translate'

/**
 * Välkomstmejlet, anpassat efter kontots roll. Premium nämns bara för
 * frilansare, och bara när betalningar är påslagna.
 */
export function welcomeContent(user: { id: string; role: string | null; name: string | null }, t: TFunction, premium = false) {
  const first = user.name?.trim().split(/\s+/)[0]
  const greeting = first ? t('Hej {name}!', { name: first }) : t('Hej!')
  if (user.role === 'provider') {
    return {
      subject: t('Välkommen till Prolink – så kommer du igång'),
      body: `${greeting} ${t('Roligt att du är här. Tre steg gör att kunder hittar och väljer dig:')}\n\n${t('1. Fyll i din profil. Bild, presentation och kompetenser gör att kunder vågar höra av sig.')}\n${t('2. Lägg upp din första tjänst, så syns du när kunder bläddrar.')}\n${t('3. Be en tidigare kund om en referens. Ett omdöme från en riktig kund väger tungt.')}\n\n${t('Du får också mejl när det kommer nya uppdrag i dina kategorier. Vilka du vill ha väljer du i din profil.')}${premium ? `

${t('Vill du synas lite mer finns Prolink Premium. Det är ett tillval som du hittar högt upp på din profil, och du behöver det inte för att komma igång.')}` : ''}`,
      path: `/profile/${user.id}`,
    }
  }
  return {
    subject: t('Välkommen till Prolink – beskriv vad du behöver hjälp med'),
    body: `${greeting} ${t('Roligt att du är här. Det enklaste sättet att komma igång är att beskriva uppdraget, så får du offerter från frilansare.')}\n\n${t('En tydlig beskrivning med mål, omfattning och eventuell budget ger bättre och mer jämförbara offerter. Du får ett mejl varje gång en offert kommer in.')}`,
    path: '/jobs/create',
  }
}

/** Mejlet till en frilansare när hens företagsverifiering har granskats. */
export function verificationResultContent(decision: 'verified' | 'rejected', note: string | null, t: TFunction) {
  if (decision === 'verified') {
    return {
      subject: t('Ditt företag är verifierat'),
      body: t('Vi har granskat uppgifterna och ditt företag visas nu som verifierat på din profil. Kunder ser att organisationsnummer och F-skatt är kontrollerade.'),
    }
  }
  return {
    subject: t('Din verifieringsansökan kunde inte godkännas'),
    body: `${t('Vi kunde inte verifiera ditt företag den här gången.')}${note ? `\n\n${t('Anteckning från oss:')} ${note}` : ''}\n\n${t('Kontrollera uppgifterna och skicka in en ny ansökan från din profil. Hör av dig om du undrar över något.')}`,
  }
}

/**
 * Påminnelsen till en kund vars offerter ligger obesvarade. Antalet räknas när
 * mejlet skickas, så att texten stämmer med läget då.
 */
export function pendingOffersContent(title: string, count: number, t: TFunction) {
  return {
    subject: t('Påminnelse: offerter väntar på svar'),
    body: `${count === 1
      ? t('Du har en offert på "{title}" som väntar på svar.', { title })
      : t('Du har {count} offerter på "{title}" som väntar på svar.', { count, title })}

${t('Frilansarna har lagt tid på sina offerter. Ett kort besked räcker, både ett ja, ett nej eller en fråga. Har du redan hittat någon kan du stänga uppdraget, så slipper fler vänta.')}`,
  }
}
