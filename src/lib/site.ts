// En enda källa för sajtens publika adress. Tidigare hade layout.tsx,
// email.ts och GoogleAuthButton.tsx tre olika reservvärden för samma sak
// ('https://prolink.se', 'http://localhost:3000' och window.location.origin),
// vilket gav delningslänkar och mejllänkar som pekade åt olika håll.
const FALLBACK = 'https://prolink-one.vercel.app'

function normalise(value: string): string {
  return value.replace(/\/+$/, '')
}

export const SITE_URL = normalise(
  process.env.NEXT_PUBLIC_APP_URL?.trim() || FALLBACK
)

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
