// En enda källa för sajtens publika adress. Tidigare hade layout.tsx,
// email.ts och GoogleAuthButton.tsx tre olika reservvärden för samma sak
// ('https://prolink.se', 'http://localhost:3000' och window.location.origin),
// vilket gav delningslänkar och mejllänkar som pekade åt olika håll.
//
// Ordningen nedan är medveten. NEXT_PUBLIC_APP_URL vinner alltid när den är
// satt, men om den saknas i Vercel får vi inte falla tillbaka på localhost:
// sitemap.xml och robots.txt bygger sina adresser på det här värdet, och en
// sitemap full av localhost-URL:er skulle publiceras till sökmotorerna.
// Vercel sätter VERCEL_PROJECT_PRODUCTION_URL och VERCEL_URL automatiskt i
// varje deployment, så de fungerar som skyddsnät utan konfiguration.
const FALLBACK = 'https://prolink-one.vercel.app'

function normalise(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    // Den stabila produktionsdomänen för projektet.
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    // Den aktuella deploymentens domän (t.ex. i förhandsvisningar).
    process.env.VERCEL_URL,
  ]

  for (const candidate of candidates) {
    const normalised = candidate ? normalise(candidate) : ''
    if (normalised) return normalised
  }

  return FALLBACK
}

export const SITE_URL = resolveSiteUrl()

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Kontaktadressen står som personuppgiftsansvarig i integritetspolicyn, i
// användarvillkoren, i FAQ och i sidfoten. Den låg tidigare hårdkodad på sju
// ställen, vilket gjorde den lätt att glömma vid ett byte.
//
// Reservvärdet var tidigare hej@prolink.se, men prolink.se saknar MX-post och
// kan inte ta emot e-post. En kontaktväg som inte fungerar är en
// efterlevnadsbrist i GDPR-texten och mot e-handelslagen, inte bara en trasig
// länk. Byt inte tillbaka förrän domänen faktiskt tar emot post.
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'webbdevstudio@gmail.com'

// Uppgifterna om den som driver tjänsten. E-handelslagen (2002:562) 8 § kräver
// namn, geografisk adress, e-post, registreringsnummer och momsnummer, och
// GDPR kräver att den personuppgiftsansvarige går att identifiera. För en
// enskild firma är organisationsnumret samma som innehavarens personnummer,
// och momsnumret är SE + organisationsnumret + 01.
export const COMPANY = {
  name: 'Webbdev Studio',
  orgNumber: '950721-6498',
  vatNumber: 'SE950721649801',
  address: 'Västra Gunnesgärde 41, 417 47 Göteborg',
  url: 'https://www.webbdev.se/',
}
