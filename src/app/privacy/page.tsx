export const metadata = {
  title: 'Integritetspolicy | Prolink',
  description: 'Läs om hur Prolink hanterar och skyddar dina personuppgifter i enlighet med GDPR.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Integritetspolicy</h1>
        <p className="text-gray-400 text-sm">Senast uppdaterad: april 2026</p>
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Personuppgiftsansvarig</h2>
          <p>Prolink (&ldquo;vi&rdquo;, &ldquo;oss&rdquo;) är personuppgiftsansvarig för behandlingen av dina personuppgifter. Kontakt: <a href="mailto:hej@prolink.se" className="text-blue-600 hover:underline">hej@prolink.se</a></p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Vilka uppgifter vi samlar in</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Kontouppgifter:</strong> namn, e-postadress och lösenord (krypterat) när du registrerar dig.</li>
            <li><strong>Profiluppgifter:</strong> biografi, kompetenser, timpris, profilbild och LinkedIn-URL som du väljer att lägga till.</li>
            <li><strong>Innehåll:</strong> uppdrag, tjänstebeskrivningar, offerter och chattmeddelanden du skapar på plattformen.</li>
            <li><strong>Tekniska uppgifter:</strong> IP-adress, webbläsartyp och loggar via Supabase.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Varför vi behandlar dina uppgifter</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>För att tillhandahålla och förbättra plattformens funktioner (avtalsfullgörelse).</li>
            <li>För att skicka e-postnotiser om offerter och meddelanden (berättigat intresse).</li>
            <li>För att uppfylla rättsliga förpliktelser enligt GDPR och annan tillämplig lagstiftning.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Delning med tredje part</h2>
          <p className="text-sm">Vi delar dina uppgifter med följande underleverantörer:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
            <li><strong>Supabase Inc.</strong> — databas och autentisering (USA, Standard Contractual Clauses).</li>
            <li><strong>Resend Inc.</strong> — e-postutskick (USA, Standard Contractual Clauses).</li>
          </ul>
          <p className="text-sm mt-3">Vi säljer aldrig dina personuppgifter till tredje part.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Lagringstid</h2>
          <p className="text-sm">Dina uppgifter lagras så länge ditt konto är aktivt. Om du begär radering tas uppgifterna bort inom 30 dagar, med undantag för uppgifter vi är skyldiga att bevara enligt lag.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Dina rättigheter (GDPR)</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Rätt till tillgång</strong> — du kan begära en kopia av dina uppgifter.</li>
            <li><strong>Rätt till rättelse</strong> — du kan korrigera felaktiga uppgifter i din profil.</li>
            <li><strong>Rätt till radering</strong> — du kan begära att vi tar bort ditt konto och dina uppgifter.</li>
            <li><strong>Rätt till dataportabilitet</strong> — du kan begära dina uppgifter i ett maskinläsbart format.</li>
            <li><strong>Rätt att invända</strong> — du kan invända mot behandling baserad på berättigat intresse.</li>
          </ul>
          <p className="text-sm mt-3">Kontakta oss på <a href="mailto:hej@prolink.se" className="text-blue-600 hover:underline">hej@prolink.se</a> för att utöva dina rättigheter. Du har också rätt att lämna klagomål till <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Integritetsskyddsmyndigheten (IMY)</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Cookies</h2>
          <p className="text-sm">Vi använder nödvändiga cookies för inloggningssessioner (via Supabase). Vi använder inga spårningscookies eller annonscookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Ändringar</h2>
          <p className="text-sm">Vi kan komma att uppdatera denna policy. Vid väsentliga ändringar meddelar vi dig via e-post eller ett meddelande på plattformen.</p>
        </section>

      </div>
    </div>
  )
}
