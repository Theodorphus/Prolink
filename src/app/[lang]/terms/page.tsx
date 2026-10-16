import { COMPANY, CONTACT_EMAIL } from '@/lib/site'
import { pageMetadata } from '@/lib/seo'
import { getLocale, getT } from '@/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return pageMetadata({
    title: t('Användarvillkor'),
    description: t('Läs Prolinks användarvillkor och förstå dina rättigheter och skyldigheter som användare av plattformen.'),
    path: '/terms',
    locale: await getLocale(),
  })
}

export default async function TermsPage() {
  const t = await getT()
  const locale = await getLocale()
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">{t('Användarvillkor')}</h1>
        <p className="text-gray-400 text-sm">{t('Senast uppdaterad: september 2026')}</p>
        {locale === 'en' && <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('Den här sidan är en översättning av den svenska originalversionen. Vid avvikelser gäller den svenska versionen.')}</p>}
      </div>

      <div className="space-y-8 text-gray-700 leading-relaxed text-sm">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('1. Godkännande av villkor')}</h2>
          <p>{t('Genom att skapa ett konto på Prolink accepterar du dessa användarvillkor. Om du inte accepterar villkoren får du inte använda tjänsten.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('2. Tjänstens syfte')}</h2>
          <p>{t('Prolink är en marknadsplats som förmedlar kontakt mellan uppdragsgivare (kunder) och leverantörer (frilansare och företag). Prolink är inte part i några avtal som ingås mellan användarna och ansvarar inte för utförandet av uppdrag eller betalning.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('3. Konton')}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('Du måste vara minst 18 år för att skapa ett konto.')}</li>
            <li>{t('Du ansvarar för att hålla dina inloggningsuppgifter säkra.')}</li>
            <li>{t('Du får bara ha ett konto per person eller organisation.')}</li>
            <li>{t('Du ansvarar för all aktivitet som sker via ditt konto.')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('4. Tillåten användning')}</h2>
          <p>{t('Du får inte:')}</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>{t('publicera falsk, vilseledande eller olaglig information.')}</li>
            <li>{t('använda plattformen för spam, bedrägeri eller annan skadlig verksamhet.')}</li>
            <li>{t('kringgå plattformen för att undvika dess villkor.')}</li>
            <li>{t('skrapa, automatisera eller missbruka plattformens API:er utan tillstånd.')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('5. Innehåll')}</h2>
          <p>{t('Du behåller äganderätten till det innehåll du publicerar. Genom att publicera innehåll ger du Prolink en icke-exklusiv licens att visa det på plattformen. Du ansvarar för att ditt innehåll inte kränker tredje parts rättigheter eller strider mot lag.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('6. Betalning och avtal mellan användare')}</h2>
          <p>{t('Prolink hanterar inga betalningar. Alla ekonomiska avtal ingås direkt mellan kund och leverantör. Prolink är inte ansvarigt för utebliven betalning, leveransfel eller tvister som uppstår mellan användarna.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('7. Ansvarsbegränsning')}</h2>
          <p>{t('Prolink tillhandahåller tjänsten ”i befintligt skick” utan garantier. I den utsträckning lagen tillåter ansvarar vi inte för indirekta skador, utebliven vinst eller dataförlust till följd av användning av tjänsten.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('8. Uppsägning')}</h2>
          <p>{t('Vi förbehåller oss rätten att stänga av eller ta bort konton som bryter mot dessa villkor. Du kan när som helst begära radering av ditt konto via')}{' '}<a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('9. Tillämplig lag')}</h2>
          <p>{t('Dessa villkor regleras av svensk lag. Tvister ska i första hand lösas genom förhandling. Om parterna inte kan komma överens ska tvisten avgöras av svensk allmän domstol med Göteborgs tingsrätt som första instans.')}</p>
        </section>

        <section id="foretagsuppgifter" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('10. Kontakt')}</h2>
          <p>{t('Prolink drivs av {name}, org.nr {orgNumber}, momsreg.nr {vatNumber}, {address}.', { name: COMPANY.name, orgNumber: COMPANY.orgNumber, vatNumber: COMPANY.vatNumber, address: COMPANY.address })}</p>
          <p className="mt-3">{t('Frågor om dessa villkor skickas till')}{' '}<a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.</p>
        </section>

      </div>
    </div>
  )
}
