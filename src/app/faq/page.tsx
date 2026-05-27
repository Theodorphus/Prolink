export const metadata = {
  title: 'Vanliga frågor',
  description: 'Svar på de vanligaste frågorna om Prolink – hur uppdrag fungerar, hur du skickar offerter och hur betalning hanteras.',
}

const faqs = [
  {
    category: 'Allmänt',
    items: [
      {
        q: 'Vad är Prolink?',
        a: 'Prolink är en svensk marknadsplats som kopplar ihop företag och privatpersoner med kvalificerade freelancers. Du kan lägga ut uppdrag och ta emot offerter, eller erbjuda dina tjänster och nå nya kunder.',
      },
      {
        q: 'Kostar det något att använda Prolink?',
        a: 'Nej — det är helt gratis att skapa konto, lägga ut uppdrag och publicera tjänster. Prolink tar ingen provision. Leverantören fakturerar kunden direkt.',
      },
      {
        q: 'Behöver jag ett företag för att registrera mig?',
        a: 'Nej. Både privatpersoner och företag kan använda Prolink, oavsett om du är kund eller leverantör.',
      },
    ],
  },
  {
    category: 'Uppdrag och offerter',
    items: [
      {
        q: 'Hur lägger jag ut ett uppdrag?',
        a: 'Skapa ett konto som kund, klicka på "Lägg ut uppdrag" och beskriv vad du behöver hjälp med. Du kan ange en budget eller lämna det öppet. Leverantörer ser ditt uppdrag och kan skicka offerter.',
      },
      {
        q: 'Hur fungerar offertsystemet?',
        a: 'En leverantör skickar en offert med pris (fast eller per timme), tidsplan och beskrivning. Du som kund kan acceptera, avslå eller chatta med leverantören innan du bestämmer dig.',
      },
      {
        q: 'Kan jag ta tillbaka en offert?',
        a: 'En leverantör kan inte ta tillbaka en skickad offert, men parterna kan alltid komma överens via chatten. Kunden kan avslå offerten när som helst innan den accepteras.',
      },
      {
        q: 'Vad händer när jag accepterar en offert?',
        a: 'Övriga offerter på samma uppdrag avvisas automatiskt. Du och leverantören kan kommunicera via den inbyggda chatten. Leverantören markerar arbetet som levererat när det är klart, och du bekräftar slutförandet.',
      },
    ],
  },
  {
    category: 'Betalning',
    items: [
      {
        q: 'Hur sker betalning?',
        a: 'Prolink hanterar inga betalningar. Leverantören fakturerar kunden direkt utanför plattformen, via faktura, Swish eller överenskommet betalningssätt.',
      },
      {
        q: 'Vad händer om leverantören inte levererar?',
        a: 'Prolink kan inte medla i tvister eller garantera leverans. Vi rekommenderar att parterna kommer överens om villkor i förväg och använder chatten för att dokumentera vad som ingår i uppdraget.',
      },
    ],
  },
  {
    category: 'Konto och roller',
    items: [
      {
        q: 'Kan jag vara både kund och leverantör?',
        a: 'Ja. Du kan byta roll när som helst under "Min profil" — all din befintliga data behålls.',
      },
      {
        q: 'Hur ändrar jag min profilbild?',
        a: 'Gå till din profil och klicka på profilbilden. Du kan ladda upp en bild på upp till 2 MB (JPG, PNG eller WebP). Om du loggade in med Google hämtas din Google-profilbild automatiskt.',
      },
      {
        q: 'Kan jag radera mitt konto?',
        a: 'Kontakta oss på hej@prolink.se så hjälper vi dig att radera ditt konto och all tillhörande data i enlighet med GDPR.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Vanliga frågor</h1>
        <p className="text-gray-500 text-lg">Hittar du inte svaret? Maila oss på <a href="mailto:hej@prolink.se" className="text-blue-600 hover:underline">hej@prolink.se</a></p>
      </div>

      <div className="space-y-12">
        {faqs.map(({ category, items }) => (
          <div key={category}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">{category}</h2>
            <div className="space-y-1">
              {items.map(({ q, a }) => (
                <details key={q} className="group border border-gray-100 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 transition-colors list-none">
                    {q}
                    <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
                    {a}
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
