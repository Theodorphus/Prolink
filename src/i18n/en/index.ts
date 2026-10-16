import app from './app.json'
import app2 from './app2.json'
import app3 from './app3.json'
import content from './content.json'
import messages from './messages.json'

// Engelska översättningar. Nyckeln är den svenska texten.
//  - app*.json:     gränssnittet (knappar, rubriker, formulär)
//  - content.json:  längre löptext (FAQ, villkor, integritetspolicy)
//  - messages.json: felmeddelanden och valideringstexter som servern skickar
// Ordlistorna slås ihop här. tests/i18n.test.mjs kontrollerar att varje text i
// koden har en översättning.
export const enClient: Record<string, string> = { ...app, ...app2, ...app3, ...messages }
export const en: Record<string, string> = { ...enClient, ...content }
