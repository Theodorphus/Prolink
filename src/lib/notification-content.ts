// Innehåll för mejl som formuleras först när de skickas, så att de speglar
// kontots läge då och inte när raden köades.

/** Välkomstmejlet, anpassat efter kontots roll. */
export function welcomeContent(user: { id: string; role: string | null; name: string | null }) {
  const first = user.name?.trim().split(/\s+/)[0]
  const greeting = first ? `Hej ${first}!` : 'Hej!'
  if (user.role === 'provider') {
    return {
      subject: 'Välkommen till Prolink – så kommer du igång',
      body: `${greeting} Roligt att du är här. Tre steg gör att kunder hittar och väljer dig:\n\n1. Fyll i din profil. Bild, presentation och kompetenser gör att kunder vågar höra av sig.\n2. Lägg upp din första tjänst, så syns du när kunder bläddrar.\n3. Be en tidigare kund om en referens. Ett omdöme från en riktig kund väger tungt.\n\nDu får också mejl när det kommer nya uppdrag i dina kategorier. Vilka du vill ha väljer du i din profil.`,
      path: `/profile/${user.id}`,
    }
  }
  return {
    subject: 'Välkommen till Prolink – beskriv vad du behöver hjälp med',
    body: `${greeting} Roligt att du är här. Det enklaste sättet att komma igång är att beskriva uppdraget, så får du offerter från frilansare.\n\nEn tydlig beskrivning med mål, omfattning och eventuell budget ger bättre och mer jämförbara offerter. Du får ett mejl varje gång en offert kommer in.`,
    path: '/jobs/create',
  }
}

/** Mejlet till en frilansare när hens företagsverifiering har granskats. */
export function verificationResultContent(decision: 'verified' | 'rejected', note: string | null) {
  if (decision === 'verified') {
    return {
      subject: 'Ditt företag är verifierat',
      body: 'Vi har granskat uppgifterna och ditt företag visas nu som verifierat på din profil. Kunder ser att organisationsnummer och F-skatt är kontrollerade.',
    }
  }
  return {
    subject: 'Din verifieringsansökan kunde inte godkännas',
    body: `Vi kunde inte verifiera ditt företag den här gången.${note ? `\n\nAnteckning från oss: ${note}` : ''}\n\nKontrollera uppgifterna och skicka in en ny ansökan från din profil. Hör av dig om du undrar över något.`,
  }
}
