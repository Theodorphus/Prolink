export const metadata = {
  title: 'Användarvillkor',
  description: 'Läs Prolinks användarvillkor och förstå dina rättigheter och skyldigheter som användare av plattformen.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Användarvillkor</h1>
        <p className="text-gray-400 text-sm">Senast uppdaterad: april 2026</p>
      </div>

      <div className="space-y-8 text-gray-700 leading-relaxed text-sm">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Godkännande av villkor</h2>
          <p>Genom att skapa ett konto på Prolink accepterar du dessa användarvillkor. Om du inte accepterar villkoren får du inte använda tjänsten.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Tjänstens syfte</h2>
          <p>Prolink är en marknadsplats som förmedlar kontakt mellan uppdragsgivare (kunder) och leverantörer (freelancers/företag). Prolink är inte part i några avtal som ingås mellan användarna och ansvarar inte för utförandet av uppdrag eller betalning.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Konton</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Du måste vara minst 18 år för att skapa ett konto.</li>
            <li>Du ansvarar för att hålla dina inloggningsuppgifter säkra.</li>
            <li>Du får bara ha ett konto per person eller organisation.</li>
            <li>Du ansvarar för all aktivitet som sker via ditt konto.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Tillåten användning</h2>
          <p>Du får inte:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>publicera falsk, vilseledande eller olaglig information.</li>
            <li>använda plattformen för spam, bedrägeri eller annan skadlig verksamhet.</li>
            <li>kringgå plattformen för att undvika dess villkor.</li>
            <li>skrapa, automatisera eller missbruka plattformens API:er utan tillstånd.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Innehåll</h2>
          <p>Du behåller äganderätten till det innehåll du publicerar. Genom att publicera innehåll ger du Prolink en icke-exklusiv licens att visa det på plattformen. Du ansvarar för att ditt innehåll inte kränker tredje parts rättigheter eller strider mot lag.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Betalning och avtal mellan användare</h2>
          <p>Prolink hanterar inga betalningar. Alla ekonomiska avtal ingås direkt mellan kund och leverantör. Prolink är inte ansvarigt för utebliven betalning, leveransfel eller tvister som uppstår mellan användarna.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Ansvarsbegränsning</h2>
          <p>Prolink tillhandahåller tjänsten &ldquo;i befintligt skick&rdquo; utan garantier. I den utsträckning lagen tillåter ansvarar vi inte för indirekta skador, utebliven vinst eller dataförlust till följd av användning av tjänsten.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Uppsägning</h2>
          <p>Vi förbehåller oss rätten att stänga av eller ta bort konton som bryter mot dessa villkor. Du kan när som helst begära radering av ditt konto via <a href="mailto:hej@prolink.se" className="text-blue-600 hover:underline">hej@prolink.se</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Tillämplig lag</h2>
          <p>Dessa villkor regleras av svensk lag. Tvister ska i första hand lösas genom förhandling. Om parterna inte kan komma överens ska tvisten avgöras av svensk allmän domstol med Stockholms tingsrätt som första instans.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Kontakt</h2>
          <p>Frågor om dessa villkor skickas till <a href="mailto:hej@prolink.se" className="text-blue-600 hover:underline">hej@prolink.se</a>.</p>
        </section>

      </div>
    </div>
  )
}
