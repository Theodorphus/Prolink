import { COMPANY, CONTACT_EMAIL } from '@/lib/site'
import { pageMetadata } from '@/lib/seo'
import { getLocale, getT } from '@/i18n/server'

export async function generateMetadata() {
  const t = await getT()
  return pageMetadata({
    title: t('Integritetspolicy'),
    description: t('Läs om hur Prolink hanterar och skyddar dina personuppgifter i enlighet med GDPR.'),
    path: '/privacy',
    locale: await getLocale(),
  })
}

export default async function PrivacyPage() {
  const t = await getT()
  const locale = await getLocale()
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">{t('Integritetspolicy')}</h1>
        <p className="text-gray-400 text-sm">{t('Senast uppdaterad: september 2026')}</p>
        {locale === 'en' && <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{t('Den här sidan är en översättning av den svenska originalversionen. Vid avvikelser gäller den svenska versionen.')}</p>}
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('1. Personuppgiftsansvarig')}</h2>
          <p>{t('Prolink drivs av {name} (”vi”, ”oss”), som är personuppgiftsansvarig för behandlingen av dina personuppgifter.', { name: COMPANY.name })}</p>
          <p className="mt-3 text-sm">
            {COMPANY.name}<br />
            {t('Org.nr')} {COMPANY.orgNumber}<br />
            {COMPANY.address}<br />
            {t('E-post:')}{' '}<a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('2. Vilka uppgifter vi samlar in')}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>{t('Kontouppgifter:')}</strong>{' '}{t('namn, e-postadress och lösenord (krypterat) när du registrerar dig.')}</li>
            <li><strong>{t('Profiluppgifter:')}</strong>{' '}{t('biografi, kompetenser, timpris, profilbild, LinkedIn-URL och hemsida som du väljer att lägga till.')}</li>
            <li><strong>{t('Företagsverifiering:')}</strong>{' '}{t('organisationsnummer, företagsnamn och uppgift om F-skatt om du ber om att få ditt företag verifierat. För enskild firma är organisationsnumret ditt personnummer. Det visas aldrig för andra användare och används bara för att kontrollera företaget mot Bolagsverket och Skatteverket; profilen visar endast företagsnamnet.')}</li>
            <li><strong>{t('Referenser:')}</strong>{' '}{t('om en frilansare ber dig om en referens behandlar vi din e-postadress för att skicka förfrågan. Lämnar du ett omdöme visas ditt namn, eventuellt företag, betyg och kommentar på frilansarens profil. E-postadressen visas aldrig.')}</li>
            <li><strong>{t('Innehåll:')}</strong>{' '}{t('uppdrag, tjänstebeskrivningar, offerter och chattmeddelanden du skapar på plattformen.')}</li>
            <li><strong>{t('Tekniska uppgifter:')}</strong>{' '}{t('IP-adress, webbläsartyp och loggar via Supabase och Vercel.')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('3. Varför vi behandlar dina uppgifter')}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>{t('För att tillhandahålla och förbättra plattformens funktioner (avtalsfullgörelse).')}</li>
            <li>{t('För att skicka e-postnotiser om uppdrag, offerter och meddelanden (berättigat intresse). Du väljer själv vilka notiser du får i din profil.')}</li>
            <li>{t('För att uppfylla rättsliga förpliktelser enligt GDPR och annan tillämplig lagstiftning.')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('4. Delning med tredje part')}</h2>
          <p className="text-sm">{t('Vi delar dina uppgifter med följande underleverantörer:')}</p>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
            <li><strong>{t('Supabase Inc.')}</strong>{' '}{t('— databas och autentisering. Uppgifterna lagras inom EU (Irland); vid eventuell överföring till USA gäller EU-kommissionens standardavtalsklausuler.')}</li>
            <li><strong>{t('Vercel Inc.')}</strong>{' '}{t('— drift av webbplatsen och besöksstatistik utan cookies (USA, standardavtalsklausuler).')}</li>
            <li><strong>{t('Resend Inc.')}</strong>{' '}{t('— e-postutskick (USA, standardavtalsklausuler).')}</li>
            <li><strong>{t('Google LLC')}</strong>{' '}{t('— inloggning med Google-konto, bara om du väljer det (USA, standardavtalsklausuler).')}</li>
            <li><strong>{t('Anthropic PBC')}</strong>{' '}{t('— maskinöversättning av uppdrag och tjänstebeskrivningar när webbplatsen visas på engelska. Bara annonsens titel och beskrivning skickas, aldrig namn eller kontaktuppgifter (USA, standardavtalsklausuler).')}</li>
          </ul>
          <p className="text-sm mt-3">{t('Vi säljer aldrig dina personuppgifter till tredje part.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('5. Lagringstid')}</h2>
          <p className="text-sm">{t('Dina uppgifter lagras så länge ditt konto är aktivt. Om du begär radering tas uppgifterna bort inom 30 dagar, med undantag för uppgifter vi är skyldiga att bevara enligt lag.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('6. Dina rättigheter (GDPR)')}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>{t('Rätt till tillgång')}</strong>{' '}{t('— du kan begära en kopia av dina uppgifter.')}</li>
            <li><strong>{t('Rätt till rättelse')}</strong>{' '}{t('— du kan korrigera felaktiga uppgifter i din profil.')}</li>
            <li><strong>{t('Rätt till radering')}</strong>{' '}{t('— du kan begära att vi tar bort ditt konto och dina uppgifter.')}</li>
            <li><strong>{t('Rätt till dataportabilitet')}</strong>{' '}{t('— du kan begära dina uppgifter i ett maskinläsbart format.')}</li>
            <li><strong>{t('Rätt att invända')}</strong>{' '}{t('— du kan invända mot behandling baserad på berättigat intresse.')}</li>
          </ul>
          <p className="text-sm mt-3">{t('Kontakta oss på')}{' '}<a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>{' '}{t('för att utöva dina rättigheter. Du har också rätt att lämna klagomål till')}{' '}<a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{t('Integritetsskyddsmyndigheten (IMY)')}</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('7. Cookies')}</h2>
          <p className="text-sm">{t('Vi använder nödvändiga cookies för inloggningssessioner (via Supabase) och en cookie som minns vilket språk du valt. Vi använder inga spårningscookies eller annonscookies.')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('8. Ändringar')}</h2>
          <p className="text-sm">{t('Vi kan komma att uppdatera denna policy. Vid väsentliga ändringar meddelar vi dig via e-post eller ett meddelande på plattformen.')}</p>
        </section>

      </div>
    </div>
  )
}
