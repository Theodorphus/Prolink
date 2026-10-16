import { CONTACT_EMAIL } from '@/lib/site'
import { pageMetadata } from '@/lib/seo'
import { getLocale, getT } from '@/i18n/server'
import { msg } from '@/i18n/msg.mjs'

export async function generateMetadata() {
  const t = await getT()
  return pageMetadata({
    title: t('Vanliga frågor'),
    description: t('Svar på de vanligaste frågorna om Prolink – hur uppdrag fungerar, hur du skickar offerter och hur betalning hanteras.'),
    path: '/faq',
    locale: await getLocale(),
  })
}

const faqs = [
  {
    category: msg('Allmänt'),
    items: [
      {
        q: msg('Vad är Prolink?'),
        a: msg('Prolink är en svensk marknadsplats som kopplar ihop företag och privatpersoner med kvalificerade frilansare. Du kan lägga ut uppdrag och ta emot offerter, eller erbjuda dina tjänster och nå nya kunder.'),
      },
      {
        q: msg('Kostar det något att använda Prolink?'),
        a: msg('Nej — det är helt gratis att skapa konto, lägga ut uppdrag och publicera tjänster. Prolink tar ingen provision. Leverantören fakturerar kunden direkt.'),
      },
      {
        q: msg('Behöver jag ett företag för att registrera mig?'),
        a: msg('Nej. Både privatpersoner och företag kan använda Prolink, oavsett om du är uppdragsgivare eller frilansare.'),
      },
    ],
  },
  {
    category: msg('Uppdrag och offerter'),
    items: [
      {
        q: msg('Hur lägger jag ut ett uppdrag?'),
        a: msg('Skapa ett konto som uppdragsgivare, klicka på ”Publicera uppdrag” och beskriv vad du behöver hjälp med. Du kan ange en budget eller lämna den öppen. Frilansare inom kategorin får en notis och kan skicka offerter.'),
      },
      {
        q: msg('Hur fungerar offertsystemet?'),
        a: msg('En leverantör skickar en offert med pris (fast eller per timme), tidsplan och beskrivning. Du som kund kan acceptera, avslå eller chatta med leverantören innan du bestämmer dig.'),
      },
      {
        q: msg('Kan jag ta tillbaka en offert?'),
        a: msg('En leverantör kan inte ta tillbaka en skickad offert, men parterna kan alltid komma överens via chatten. Kunden kan avslå offerten när som helst innan den accepteras.'),
      },
      {
        q: msg('Vad händer när jag accepterar en offert?'),
        a: msg('Övriga offerter på samma uppdrag avvisas automatiskt. Du och leverantören kan kommunicera via den inbyggda chatten. Leverantören markerar arbetet som levererat när det är klart, och du bekräftar slutförandet.'),
      },
    ],
  },
  {
    category: msg('Betalning'),
    items: [
      {
        q: msg('Hur sker betalning?'),
        a: msg('Prolink hanterar inga betalningar. Leverantören fakturerar kunden direkt utanför plattformen, via faktura, Swish eller överenskommet betalningssätt.'),
      },
      {
        q: msg('Vad händer om leverantören inte levererar?'),
        a: msg('Prolink kan inte medla i tvister eller garantera leverans. Vi rekommenderar att parterna kommer överens om villkor i förväg och använder chatten för att dokumentera vad som ingår i uppdraget.'),
      },
    ],
  },
  {
    category: msg('Konto och roller'),
    items: [
      {
        q: msg('Kan jag vara både uppdragsgivare och frilansare?'),
        a: msg('Ja. Du kan byta roll när som helst från din profil. Dina uppdrag och omdömen finns kvar, och dina tjänster döljs medan du är uppdragsgivare och syns igen när du byter tillbaka.'),
      },
      {
        q: msg('Hur ändrar jag min profilbild?'),
        a: msg('Gå till din profil och klicka på profilbilden. Du kan ladda upp en bild på upp till 2 MB (JPG, PNG eller WebP). Om du loggade in med Google hämtas din Google-profilbild automatiskt.'),
      },
      {
        q: msg('Kan jag radera mitt konto?'),
        a: msg('Kontakta oss på {email} så hjälper vi dig att radera ditt konto och all tillhörande data i enlighet med GDPR.'),
      },
    ],
  },
]

export default async function FaqPage() {
  const t = await getT()
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">{t('Vanliga frågor')}</h1>
        <p className="text-gray-500 text-lg">{t('Hittar du inte svaret? Mejla oss på')} <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a></p>
      </div>

      <div className="space-y-12">
        {faqs.map(({ category, items }) => (
          <div key={category}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">{t(category)}</h2>
            <div className="space-y-1">
              {items.map(({ q, a }) => (
                <details key={q} className="group border border-gray-100 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 transition-colors list-none">
                    {t(q)}
                    <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
                    {t(a, { email: CONTACT_EMAIL })}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
