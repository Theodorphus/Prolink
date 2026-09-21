# Granskning av Prolink

Datum: 2026-09-21. Kodversion: `5dbe608`, branch `master`.

Granskningen omfattar applikationskod, migrationsfiler, befintliga tester, produktionsbygge, produktionsberoenden och den publika webbplatsen på https://prolink-one.vercel.app. Startsidan granskades visuellt på dator; tjänstelistan och mobilmenyn kontrollerades vid 390 × 844. Inloggningssidan inspekterades utan att skapa konto.

Inga produktionsdata har skrivits eller raderats. Databasfynd nedan är härledda ur migrationskoden, inte verifierade genom angrepp mot produktion. Produktionsdatabasens faktiska migrationer, roller och policyer är inte verifierade. Inloggade tvåpartsflöden, verklig mejlleverans, backupåterställning och Core Web Vitals har inte testats. Detta är inte en fullständig penetrationstestning eller juridisk granskning.

## Prioriterade fel

### 1. P1 – Säkerhetsuppdatera Next.js och Sharp

`npm audit --omit=dev --json` rapporterar två berörda paket: Next.js med kritisk allvarlighetsgrad och Sharp med hög. Det lokala bygget använder Next.js 16.3.2. Advisories anger korrigering i Next.js 16.3.3 och Sharp 0.35.4. Windows-felet gäller Windows-hostade servrar; det är inte bevis för att Vercel-installationen är exploaterbar. Den andra Next.js-varningen gäller AVIF i bildoptimeringen. Faktisk exploaterbarhet behöver bedömas mot driftmiljö och bildflöde.

Åtgärd: uppdatera beroenden och låsfil till korrigerade versioner, verifiera uppladdning/bildoptimering och kör kontrollerna igen.

Källor: [Next.js Windows](https://github.com/advisories/GHSA-p293-qw3h-jr36), [Next.js AVIF](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), [Sharp](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).

### 2. P1 – Offertfunktionen returnerar data före behörighetskontroll

I `supabase/migrations/010_phase1_security_baseline.sql:351` returnerar `transition_offer` hela offerten om begärd status redan är aktuell. Detta sker före kontrollen av kund/leverantör. Funktionen är SECURITY DEFINER och får köras av authenticated. En inloggad utomstående som känner till ett offert-ID kan därför, enligt migrationens modell, läsa offertdata genom att skicka dess befintliga status. Ett svårgissat UUID ersätter inte behörighetskontrollen.

Åtgärd: verifiera att anroparen är part innan varje retur, även vid upprepade anrop. Lägg till test med en tredje användare för samtliga statusvärden. Använd en ny migration för befintliga installationer.

Bakgrund: [Supabase om exponerade SECURITY DEFINER-funktioner](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 3. P1 – Uppdragsradering tar även bort affärshistorik

`src/app/api/jobs/[id]/route.ts:26` tillåter ägaren att radera uppdrag utan kontroll av pågående eller avslutade offerter. Databasens ON DELETE CASCADE går från uppdrag till offerter och vidare till meddelanden och omdömen (`001_initial_schema.sql` och `007_category_readat_reviews.sql`). Kunden kan därmed radera historik som även leverantören behöver och få ett omdöme om sig borttaget.

Åtgärd: arkivera uppdrag med affärshistorik och skydda regeln i databasen. Bestäm separat vad som ska få raderas för rena utkast/uppdrag utan affär. Testa med slutförd offert och omdömen i testdatabas.

### 4. P1 – Kontaktflödet för tjänster når inte vald leverantör

`src/app/services/[id]/page.tsx:131` länkar ”Diskutera tjänsten” till profilen. Där länkar nästa handling till `/jobs/create` (`src/app/profile/[id]/page.tsx:172`), utan vald tjänst eller leverantör. Chatten kräver redan en offert. En köpare kan alltså inte starta den utlovade dialogen om den valda tjänsten genom detta flöde.

Åtgärd: skapa en riktad förfrågan som bevarar tjänst och mottagare genom inloggning. Alternativt beskriv tydligt att användaren publicerar ett öppet uppdrag. Lägg ett test över hela vägen från tjänstekort till mottagen förfrågan.

### 5. P2 – Bilaga utan text aktiverar inte skicka-knappen

`src/components/chat/ChatInput.tsx:106` beräknar disabled från `fileRef.current`, men filfältet på rad 113 saknar onChange som uppdaterar state. Filval ger därför ingen omrendering som aktiverar knappen. Vald fil visas heller inte. Filfältet rensas redan före lyckad meddelandesändning, vilket försvårar återförsök.

Åtgärd: håll vald fil i state, visa filnamn och ta-bort-knapp, rensa först efter lyckad sändning. Skydda även mot parallella submits och behåll text/fil vid nätverksfel.

### 6. P2 – Skickade meddelanden är helt beroende av Realtime

`src/components/chat/ChatWindow.tsx:61` använder inte det sparade meddelandet i POST-svaret. Meddelandelistan uppdateras enbart av Realtime; prenumerationen saknar återhämtning och hämtning av missade meddelanden. Vid avbrott kan textfältet tömmas utan att meddelandet syns, trots att det sparats.

Åtgärd: lägg till meddelandet från POST-svaret med ID-baserad deduplicering, visa anslutningsstatus och hämta ikapp vid återanslutning. Testa med bruten Realtime-anslutning men fungerande HTTP.

### 7. P2 – Registreringen hanterar inte väntande mejlbekräftelse

`src/lib/actions/auth.ts:83` tar bara emot error från signUp och skickar alltid till startsidan vid framgång. Om mejlbekräftelse krävs kan kontot vara skapat utan session. Användaren får då ingen förklaring till varför hen fortfarande är utloggad.

Åtgärd: hantera session respektive väntande bekräftelse separat, visa instruktioner och ge möjlighet att skicka om bekräftelsen. Verifiera både med och utan bekräftelsekrav i en testmiljö. Inloggningssidan saknar dessutom ett flöde för glömt lösenord.

### 8. P2 – Inloggning tappar användarens ursprungliga mål

LoginPage skickar `redirect` till AuthForm, men GoogleAuthButton får en separat `next`-prop som sidan aldrig sätter. Google-inloggning återgår därför till standardmålet. Länken till registrering tappar också redirect och registreringen går alltid till `/`.

Åtgärd: använd en gemensam validerad returadress genom lösenordsinloggning, OAuth och registrering. Testa ”publicera uppdrag → skapa konto → fortsätt publicera”. Google-knappen behöver även synlig felhantering och återställning av loading vid OAuth-fel.

### 9. P2 – Canonical pekar på startsidan även på tjänstelistan

`src/app/layout.tsx:18` sätter canonical till `/`, och undersidorna skriver inte över detta. I produktionssidans DOM på `/services` verifierades canonical `https://www.prolink.se`, alltså startsidan. Det ger sökmotorer fel signal om vilken URL som representerar innehållet.

Åtgärd: sätt canonical per publik sida och per detaljsida. Bestäm avsiktligt hur filter-URL:er ska hanteras. Anpassa också Open Graph-data för delade tjänster och profiler.

Referens: [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).

### 10. P2 – Tjänstesidans betyg bygger bara på tre omdömen

`src/app/services/[id]/page.tsx:44` begränsar omdömena till tre och beräknar sedan medelbetyget på just dessa på rad 51. Profilen räknar över fler omdömen. Samma person kan därför ha olika presenterat totalbetyg på olika sidor.

Åtgärd: beräkna betyg och antal över hela underlaget, separat från de tre omdömen som visas. Testa med minst fyra omdömen med olika betyg.

### 11. P2 – Hastighetsbegränsningen skyddar inte alla skrivvägar

Kontrollen ligger i Next.js-rutterna, medan migrationsfilerna fortsatt tillåter direkta inserts via Supabase för behöriga användare. Dessa skrivningar passerar inte withinRateLimit. Det kringgår inte automatiskt RLS, men kvoten skyddar inte mot samma användares direkta dataspam. Funktionen i migration 013 räknar dessutom utan serialisering per användare/handling; samtidiga anrop kan passera utifrån olika synliga räknarvärden. Nekade anrop skapar fortfarande rader.

Åtgärd: genomdriv kvoter atomiskt i den faktiska skrivvägen, exempelvis via begränsade RPC-funktioner eller lämplig databaslogik. Testa direkta skrivningar och samtidighet, inte bara att funktionsnamnet finns i API-koden. Definiera uttryckligen beteendet vid databasfel.

### 12. P2 – Läsning av chatt använder sändningskvoten

`src/app/api/messages/[offerId]/route.ts:34` använder messages:send även i GET. Anrop som enbart läser meddelanden förbrukar därför utrymmet för att skicka. Den nuvarande chattkomponenten hämtar huvudsakligen på annat sätt, men API-kontraktet är fel och påverkar andra eller framtida klienter.

Åtgärd: separera läs- och skrivkvoter. Testa att upprepad GET inte blockerar normal POST.

### 13. P2 – Driftfel presenteras som tom marknadsplats

`src/app/services/page.tsx:62` och `src/app/jobs/page.tsx:38` ignorerar error i databasresultatet. Vid ett databasfel visas noll tjänster/uppdrag och tomtillstånd i stället för ett fel med återförsök. På detaljsidor kan motsvarande mönster bli falsk 404.

Åtgärd: skilj tomt resultat, saknad post och tekniskt fel. Behåll sökfilter vid återförsök och logga diagnostik på serversidan.

### 14. P2 – Formulär kan fastna vid nätverksfel

CreateJobForm och CreateServiceForm sätter loading men saknar try/catch/finally runt fetch och JSON-tolkning. Ett avbrutet nätverk eller ett HTML-felsvar lämnar användaren utan begripligt fel och kan lämna knappen låst.

Åtgärd: hantera nätverksfel och oväntade svar, återställ loading, behåll formulärinnehåll och gör återförsök säkra. Lägg idempotens där ett timeoutat svar kan ha föregåtts av en lyckad skrivning.

## Tillgänglighet, mobil och innehåll

15. **Filter saknar tillgängliga namn.** ServiceFilters har sökfält, prisfält och select-element utan kopplade etiketter. Detta syns också i webbläsarens tillgänglighetsträd. Lägg till label och vid behov sr-only-text. Skicka-knappen i chatten och stjärnknapparna i StarRating behöver också namn; betygsvalet behöver annonserat valt värde.

16. **Mobilmenyn håller inte fokus inom den öppna panelen.** Escape och inert för stängd meny finns, vilket är bra. Vid öppning saknas däremot fokusförflyttning, fokusfälla och inaktivering av bakgrunden. Tangentbordsanvändare kan fortsätta till innehåll bakom överlägget. Hantera fokus och återställ det till menyknappen när panelen stängs.

17. **Prisfiltret är visuellt trasigt på mobil.** Vid 390 px ligger ”Max” och placeholder ”Pris” tätt ihop medan ”kr” hamnar långt till höger utanför själva inputfältet. Sätt en gemensam bredd på omslutningen och håll prefix, input och suffix ihop. Tjänstelistan hade ingen horisontell sidöverströmning i denna kontroll.

18. **Fast pris och frånpris blandas.** Tjänstelistan säger ”fast pris”, medan kort och detaljsida visar ”från”. Välj en konsekvent prismodell och visa vad som ingår, antal revisioner, leveransvillkor och om priset inkluderar moms. Detta är produktförtydliganden; någon skattemässig bedömning har inte gjorts.

19. **Startsidan kan bli mer konkret.** Behåll den tydliga huvudrubriken och uppdelningen mellan köpare/säljare. Visa verkliga tjänsteexempel tidigare och korta upprepade CTA-avsnitt. Byt tekniska förtroendetexter som ”regeln är låst i databasen” mot nyttan: ”Omdömen från genomförda uppdrag”. Formulera lågt utbud som en ärlig uppstartsfas med ett tydligt nästa steg. Dessa är designförslag, inte uppmätta konverteringsresultat.

## Prestanda och drift

20. **Sökning navigerar vid varje tecken.** ServiceFilters använder router.push direkt i onChange och defaultValue för text/pris. Inför kort debounce eller explicit sökning, router.replace för löpande uppdateringar och synkronisering när URL ändras. Det minskar serverarbete och onödiga historikposter och håller synliga fält i takt med bakåt/framåt.

21. **Listor saknar sidindelning.** Uppdrag, tjänster och flera historikfrågor hämtas utan range/egen sidgräns. Resultatet blir större rendering och till slut risk för tyst trunkering vid databasens konfigurerade maxgräns. Inför stabil sortering med ID som sekundärnyckel, paginering och separat totalantal. Gör motsvarande plan för sitemap när utbudet växer.

22. **Mejlflödet skalar dåligt.** Publicering av uppdrag inväntar ett parallellt utskick till alla matchande leverantörer, eller alla leverantörer när ingen matchar (`src/app/api/jobs/route.ts:158`). Det ger väntetid, anropsspikar och bortfall utan beständig retry. Använd en beständig utkorg/kö med begränsad samtidighet, återförsök och deduplicering. Ge användare relevans- och frekvensval. Varje chattmeddelande behöver inte ge ett separat mejl.

23. **Publika sidor gör mycket sessionsarbete.** Proxy och flera komponenter/sidor hämtar användare, och bygget visar att nästan alla sidor är dynamiska. Mät faktisk svarstid och databasrundresor innan cache införs. Separera publika frågor från användarspecifika data; cachea aldrig privata svar gemensamt.

## Testresultat och rekommenderad ordning

- `npm run build`: godkänt.
- `npm run typecheck`: godkänt.
- `npm test`: 14 av 14 godkända.
- `npm run lint`: 0 fel, 21 varningar.
- `npm audit --omit=dev`: 2 berörda paket, varav 1 kritiskt och 1 högt.

Flera befintliga säkerhetstester letar efter text i källfiler. De bekräftar att kodmönster finns, men inte att databasen faktiskt blockerar en obehörig användare eller håller vid samtidighet. Komplettera med integrationstester mot isolerad databas: kund, leverantör och tredje användare; offertlivscykel; bilagor; omdömen; radering och kvoter. Lägg därefter webbläsartester för registrering, kontakt och chatt med simulerade nätverksfel.

Rekommenderad ordning: säkerhetsuppdateringar och databasbehörighet → bevara affärshistorik → fungerande kontakt/registrering/chatt → canonical och betyg → tillgänglighet och mobil → skalning och konverteringsförbättringar.


## Åtgärdsstatus efter genomförandet

Samtliga 23 punkter har fått kodåtgärder. Rapportens fynd ovan beskriver versionen före
ändringarna, inte det aktuella arbetsinnehållet.

- 1–3: beroenden uppdaterade, offertkontroll före varje retur och arkivering med bevarad historik.
- 4: riktad privat förfrågan med vald tjänst/leverantör, bevarad genom inloggning.
- 5–6: filval i state, skydd mot parallell sändning, idempotenta återförsök,
  meddelandet läggs till från serversvaret, återhämtning och äldre historik med sidmarkörer.
- 7–8: bekräftelsebesked, skicka om mejl, lösenordsåterställning, gemensam returadress och OAuth-fel.
- 9–10: egna canonical-adresser, relevanta delningstitlar och betyg över hela underlaget.
- 11–12: atomiska kvoter på verkliga databasinsättningar; GET påverkar ingen skrivkvot.
- 13–14: tekniska fel skiljs från tomma resultat; formulär återställs vid nätverksfel.
- 15–17: etiketter, tillgängligt betygsval, fokusfälla och bakgrundsinert i mobilmeny samt ombyggt prisfilter.
- 18–19: konsekventa frånpriser, explicit momsuppgift, verkliga tjänster tidigare och enklare förtroendetext.
- 20–21: explicit sökning med URL-synk, sidindelning för listor/profiler/konversationer och uppdelad sitemap.
- 22–23: transaktionell utkorg med retry/deduplicering/inställningar, anonym kort cache för startsidan och deduplicerad autentisering inom begäran.

Migrationerna 015–017 är testade lokalt men inte applicerade på den hostade databasen.
Ingen publicering eller ändring av driftkonton är genomförd. Se README för ordningen
migrationer → driftinställningar för notiskön → publicering → test med separata konton.
Verklig OAuth, mejlleverans, Realtime-avbrott i webbläsare och fleranslutningslast behöver
fortfarande verifieras i en separat ansluten testmiljö. Ingen förbättring av Core Web Vitals
eller konverteringsgrad påstås utan mätning.

Slutkontroll: lint utan fel eller varningar, godkänd typkontroll och produktionsbygge,
21 godkända tester samt 0 kända sårbarheter i npm audit (inklusive utvecklingsberoenden).
Mobilfilter, sökning, menyfokus och bibehållen tjänst i inloggnings-/registreringslänkar
är verifierade i den lokala webbläsaren.
