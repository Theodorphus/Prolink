import app from './app.json'
import app2 from './app2.json'
import app3 from './app3.json'
import content from './content.json'
import messages from './messages.json'
import serverOnly from '../server-only-keys.json'

// Engelska översättningar. Nyckeln är den svenska texten.
//  - app*.json:     gränssnittet (knappar, rubriker, formulär)
//  - content.json:  längre löptext (FAQ, villkor, integritetspolicy)
//  - messages.json: felmeddelanden och valideringstexter som servern skickar
// Ordlistorna slås ihop här. tests/i18n.test.mjs kontrollerar att varje text i
// koden har en översättning.
export const en: Record<string, string> = { ...app, ...app2, ...app3, ...messages, ...content }

// Det som skickas till webbläsaren: gränssnittet utom de texter som bara
// översätts på servern (se server-only-keys.json och scripts/i18n-keys.mjs).
// Halverar ordlistan som följer med varje sida under /en.
const serverOnlyKeys = new Set<string>(serverOnly)
export const enClient: Record<string, string> = Object.fromEntries(
  Object.entries({ ...app, ...app2, ...app3, ...messages }).filter(([key]) => !serverOnlyKeys.has(key))
)
