import { CATEGORIES, type CategoryValue } from '@/lib/categories'

/**
 * Redaktionellt innehåll per kategori.
 *
 * Landningssidorna finns för att bli hittade i sök. En sida som bara listar
 * samma kort som /services med ett filter är tunt innehåll: sökmotorer rankar
 * den inte, och en besökare får inget av den. Texterna nedan svarar därför på
 * de frågor en småföretagare faktiskt ställer innan hen anlitar någon, och
 * prisspannen speglar svenska marknadsnivåer.
 *
 * Inget här är påhittade omdömen, kundlogotyper eller volymsiffror. Det som
 * går att motbevisa med ett klick på uppdragslistan skadar förtroendet mer än
 * det hjälper.
 */
export interface CategoryContent {
  /** Sidrubrik. Formuleras som besökaren söker, inte som vi döpt kategorin. */
  heading: string
  /** Metabeskrivning, cirka 155 tecken. */
  description: string
  /** Kort brödtext under rubriken. */
  intro: string
  /** Vanliga uppdrag inom kategorin. */
  examples: string[]
  /** Prisspann att förhålla sig till. */
  priceGuide: { label: string; range: string }[]
  /** Frågor och svar. Renderas även som FAQPage-strukturerad data. */
  faq: { q: string; a: string }[]
}

const CONTENT: Record<string, CategoryContent> = {
  webbutveckling: {
    heading: 'Hitta webbutvecklare till ditt företag',
    description:
      'Jämför offerter från svenska webbutvecklare. Beskriv vad du behöver, få förslag och välj själv. Kostnadsfritt att publicera uppdrag.',
    intro:
      'Behöver ni en ny hemsida, en webbshop eller hjälp att bygga vidare på något som redan finns? Beskriv uppdraget en gång, så kan flera utvecklare lämna konkreta offerter på det.',
    examples: [
      'Ny hemsida med kontaktformulär och prislista',
      'Webbshop med betalning och fraktalternativ',
      'Bokningssystem kopplat till kalender',
      'Flytt av befintlig sida till en modern plattform',
      'Löpande underhåll, uppdateringar och säkerhetsfixar',
    ],
    priceGuide: [
      { label: 'Enklare hemsida, några sidor', range: '15 000–40 000 kr' },
      { label: 'Hemsida med bokning eller inloggning', range: '40 000–120 000 kr' },
      { label: 'Webbshop', range: '50 000–200 000 kr' },
      { label: 'Löpande underhåll', range: '1 000–5 000 kr/mån' },
    ],
    faq: [
      {
        q: 'Vad kostar det att göra en hemsida?',
        a: 'Det beror på omfattningen. En enklare sida med några undersidor landar ofta mellan 15 000 och 40 000 kronor, medan en sida med bokning, inloggning eller e-handel kostar mer. Det säkraste sättet att få ett rättvisande pris är att beskriva behovet och jämföra flera offerter.',
      },
      {
        q: 'Hur lång tid tar ett webbprojekt?',
        a: 'En enklare hemsida tar ofta två till fyra veckor från start till publicering. Större projekt med integrationer tar längre tid. Tidsplanen påverkas mycket av hur snabbt ni själva kan leverera texter och bilder.',
      },
      {
        q: 'Vad behöver jag förbereda innan jag tar in offerter?',
        a: 'Skriv ner vad sidan ska göra, vem den riktar sig till och om något måste finnas med, som bokning eller betalning. Har ni en befintlig sida, länka till den. Ju tydligare beskrivning, desto mer jämförbara blir offerterna.',
      },
    ],
  },
  design: {
    heading: 'Hitta grafisk designer och formgivare',
    description:
      'Jämför offerter från svenska designers för logotyp, grafisk profil och formgivning. Beskriv uppdraget och få förslag.',
    intro:
      'Ska ni ta fram en logotyp, en grafisk profil eller material till tryck och sociala medier? Beskriv vad ni behöver, så kan designers lämna offert på just det.',
    examples: [
      'Logotyp och grundläggande grafisk profil',
      'Färger, typsnitt och mallar för dokument',
      'Formgivning av trycksaker och skyltar',
      'Bildmaterial anpassat för sociala medier',
      'Design av gränssnitt inför ett webbprojekt',
    ],
    priceGuide: [
      { label: 'Logotyp', range: '5 000–25 000 kr' },
      { label: 'Grafisk profil', range: '15 000–60 000 kr' },
      { label: 'Trycksaker, per styck', range: '2 000–10 000 kr' },
      { label: 'Designsystem för webb', range: '25 000–80 000 kr' },
    ],
    faq: [
      {
        q: 'Vad kostar en logotyp?',
        a: 'Ofta mellan 5 000 och 25 000 kronor. Skillnaden ligger i hur många förslag som tas fram, hur mycket research som ingår och om ni får med en grafisk profil med färger och typsnitt.',
      },
      {
        q: 'Äger jag designen efteråt?',
        a: 'Det ska framgå av överenskommelsen. Reglera rättigheterna innan arbetet börjar och be att få originalfilerna vid leverans, inte bara exporterade bilder.',
      },
      {
        q: 'Hur många förslag brukar ingå?',
        a: 'Vanligtvis två till tre riktningar och därefter ett par justeringsrundor på den ni väljer. Be designern skriva ut antalet rundor i offerten, så slipper ni diskussion senare.',
      },
    ],
  },
  marknadsforing: {
    heading: 'Hitta hjälp med digital marknadsföring',
    description:
      'Jämför offerter inom SEO, annonsering och sociala medier. Beskriv ert mål och få förslag från svenska specialister.',
    intro:
      'Vill ni synas bättre i sök, komma igång med annonsering eller få ordning på era sociala kanaler? Beskriv målet, så kan specialister föreslå hur de skulle arbeta.',
    examples: [
      'Sökmotoroptimering för att synas på Google',
      'Annonsering via Google Ads eller Meta',
      'Löpande innehåll till sociala medier',
      'Nyhetsbrev och e-postutskick',
      'Analys och uppföljning av resultat',
    ],
    priceGuide: [
      { label: 'SEO-genomgång, engångs', range: '8 000–30 000 kr' },
      { label: 'Löpande SEO', range: '5 000–25 000 kr/mån' },
      { label: 'Annonshantering', range: '3 000–15 000 kr/mån' },
      { label: 'Sociala medier, löpande', range: '5 000–20 000 kr/mån' },
    ],
    faq: [
      {
        q: 'Hur snabbt ger marknadsföring resultat?',
        a: 'Annonsering ger trafik direkt men kostar så länge den pågår. Sökmotoroptimering tar oftast tre till sex månader innan det syns tydligt, men effekten sitter kvar längre. Var skeptisk mot den som lovar snabba toppositioner.',
      },
      {
        q: 'Vad kostar annonsbudgeten utöver arvodet?',
        a: 'Arvodet till specialisten och pengarna till Google eller Meta är två skilda kostnader. Kontrollera alltid vad som ingår i offerten, så ni inte räknar med en budget som bara täcker arbetet.',
      },
      {
        q: 'Hur vet jag att det fungerar?',
        a: 'Kom överens om vad som ska mätas innan arbetet börjar: besökare, förfrågningar eller försäljning. Be om löpande rapportering mot just de måtten.',
      },
    ],
  },
  redovisning: {
    heading: 'Hitta bokförare och redovisningskonsult',
    description:
      'Jämför offerter från svenska redovisningskonsulter för löpande bokföring, bokslut och deklaration.',
    intro:
      'Behöver ni hjälp med löpande bokföring, momsredovisning eller årsbokslut? Beskriv företagets storlek och behov, så kan konsulter lämna offert.',
    examples: [
      'Löpande bokföring varje månad',
      'Momsdeklaration och arbetsgivardeklaration',
      'Årsbokslut och årsredovisning',
      'Lönehantering',
      'Rådgivning inför bolagsbildning eller expansion',
    ],
    priceGuide: [
      { label: 'Löpande bokföring, mindre bolag', range: '800–3 000 kr/mån' },
      { label: 'Lönehantering, per anställd', range: '150–400 kr/mån' },
      { label: 'Årsbokslut och årsredovisning', range: '8 000–25 000 kr' },
      { label: 'Deklaration enskild firma', range: '3 000–8 000 kr' },
    ],
    faq: [
      {
        q: 'Vad kostar en bokförare för ett litet företag?',
        a: 'För ett mindre aktiebolag med begränsat antal verifikationer ligger löpande bokföring ofta mellan 800 och 3 000 kronor i månaden. Priset styrs av antalet transaktioner och om lön ingår.',
      },
      {
        q: 'Behöver konsulten vara auktoriserad?',
        a: 'Det finns inget lagkrav för bokföring, men auktorisation genom SRF eller FAR innebär krav på utbildning och ansvarsförsäkring. Fråga efter det om ni vill ha den tryggheten.',
      },
      {
        q: 'Kan bokföringen skötas på distans?',
        a: 'Ja, det är numera det vanliga. Underlag skickas digitalt och arbetet sker i molnbaserade system som Fortnox eller Visma. Ni behöver inte ha konsulten på samma ort.',
      },
    ],
  },
  juridik: {
    heading: 'Hitta juridisk hjälp med avtal',
    description:
      'Jämför offerter från jurister för avtal, villkor och affärsjuridisk rådgivning till företag.',
    intro:
      'Behöver ni granska ett avtal, ta fram allmänna villkor eller få rådgivning inför en affär? Beskriv ärendet, så kan jurister lämna förslag.',
    examples: [
      'Kundavtal och leverantörsavtal',
      'Allmänna villkor för webbplats eller tjänst',
      'Anställningsavtal och konsultavtal',
      'Integritetspolicy och GDPR-genomgång',
      'Aktieägaravtal och bolagsfrågor',
    ],
    priceGuide: [
      { label: 'Granskning av befintligt avtal', range: '3 000–12 000 kr' },
      { label: 'Nytt avtal från grunden', range: '8 000–30 000 kr' },
      { label: 'Allmänna villkor', range: '5 000–20 000 kr' },
      { label: 'Löpande rådgivning', range: '1 500–3 500 kr/tim' },
    ],
    faq: [
      {
        q: 'Vad kostar det att få ett avtal granskat?',
        a: 'En granskning av ett befintligt avtal med skriftliga kommentarer ligger ofta mellan 3 000 och 12 000 kronor, beroende på avtalets längd och komplexitet.',
      },
      {
        q: 'Räcker det med en avtalsmall?',
        a: 'En mall kan fungera för enkla och återkommande situationer, men den tar inte hänsyn till er specifika affär. Vid större värden eller längre åtaganden är det oftast värt att låta en jurist anpassa den.',
      },
      {
        q: 'Vad gäller kring GDPR för ett litet företag?',
        a: 'Behandlar ni personuppgifter, till exempel kunduppgifter eller nyhetsbrev, omfattas ni av reglerna oavsett storlek. Ni behöver kunna redogöra för vilka uppgifter ni har, varför, och hur länge de sparas.',
      },
    ],
  },
  text: {
    heading: 'Hitta copywriter och översättare',
    description:
      'Jämför offerter från svenska skribenter och översättare för webbtext, artiklar och översättning.',
    intro:
      'Behöver ni texter till hemsidan, artiklar som syns i sök eller översättning till andra språk? Beskriv uppdraget, så kan skribenter lämna offert.',
    examples: [
      'Texter till hemsidans undersidor',
      'Artiklar och blogginlägg anpassade för sök',
      'Produktbeskrivningar till webbshop',
      'Översättning mellan svenska och engelska',
      'Språkgranskning av befintligt material',
    ],
    priceGuide: [
      { label: 'Webbtext, per sida', range: '1 500–6 000 kr' },
      { label: 'Artikel, 800–1 200 ord', range: '2 500–8 000 kr' },
      { label: 'Översättning, per ord', range: '1,50–3,50 kr' },
      { label: 'Språkgranskning, per timme', range: '600–1 200 kr' },
    ],
    faq: [
      {
        q: 'Vad kostar en webbtext?',
        a: 'Ofta mellan 1 500 och 6 000 kronor per sida beroende på hur mycket research som krävs och om texten ska sökoptimeras. Många skribenter tar ett fast pris per uppdrag hellre än per ord.',
      },
      {
        q: 'Vad är skillnaden mellan copywriting och översättning?',
        a: 'En copywriter skriver ny text utifrån ert budskap och er målgrupp. En översättare överför befintlig text till ett annat språk. Ska en text fungera lika bra på ett nytt språk behövs ofta bearbetning, inte bara direkt översättning.',
      },
      {
        q: 'Kan skribenten arbeta utifrån vår ton?',
        a: 'Ja. Skicka med exempel på texter ni tycker fungerar och beskriv hur ni vill uppfattas. De flesta skribenter vill ha det underlaget innan de börjar.',
      },
    ],
  },
  'foto-video': {
    heading: 'Hitta fotograf och videoproducent',
    description:
      'Jämför offerter från svenska fotografer och videoproducenter för företagsbilder, produktfoto och film.',
    intro:
      'Behöver ni bilder på teamet, produktfoton till webbshoppen eller en kort film? Beskriv uppdraget, så kan fotografer och filmare lämna offert.',
    examples: [
      'Porträtt och miljöbilder till hemsidan',
      'Produktfoto för webbshop',
      'Kort företagsfilm eller presentationsvideo',
      'Filmning av event',
      'Redigering av befintligt material',
    ],
    priceGuide: [
      { label: 'Halvdag fotografering', range: '5 000–12 000 kr' },
      { label: 'Heldag fotografering', range: '10 000–25 000 kr' },
      { label: 'Produktfoto, per bild', range: '200–800 kr' },
      { label: 'Kort företagsfilm', range: '20 000–80 000 kr' },
    ],
    faq: [
      {
        q: 'Vad kostar en fotograf per dag?',
        a: 'En heldag ligger ofta mellan 10 000 och 25 000 kronor inklusive efterbehandling. Kontrollera hur många färdiga bilder som ingår, för det varierar mycket mellan olika fotografer.',
      },
      {
        q: 'Får vi använda bilderna hur vi vill?',
        a: 'Inte automatiskt. Upphovsrätten stannar hos fotografen om inget annat avtalas. Kom överens om användningen i förväg, särskilt om bilderna ska användas i annonsering.',
      },
      {
        q: 'Hur lång tid tar efterbearbetningen?',
        a: 'Räkna med en till tre veckor för foto och längre för film. Be om en leveranstid skriftligt, särskilt om materialet ska användas till en kampanj med fast datum.',
      },
    ],
  },
  'it-support': {
    heading: 'Hitta IT-support och teknisk hjälp',
    description:
      'Jämför offerter från svenska IT-konsulter för support, nätverk, säkerhet och molntjänster.',
    intro:
      'Behöver ni löpande IT-support, hjälp med säkerhet eller en flytt till molnet? Beskriv er situation, så kan konsulter föreslå en lösning.',
    examples: [
      'Löpande support till kontoret',
      'Uppsättning av datorer och konton',
      'Nätverk, brandvägg och wifi',
      'Säkerhetskopiering och återställning',
      'Flytt till Microsoft 365 eller Google Workspace',
    ],
    priceGuide: [
      { label: 'Supportavtal, per användare', range: '300–900 kr/mån' },
      { label: 'Timdebiterad support', range: '900–1 600 kr/tim' },
      { label: 'Uppsättning av arbetsplats', range: '2 000–6 000 kr' },
      { label: 'Säkerhetsgenomgång', range: '10 000–40 000 kr' },
    ],
    faq: [
      {
        q: 'Vad kostar IT-support för ett litet kontor?',
        a: 'Ett supportavtal ligger ofta mellan 300 och 900 kronor per användare och månad. Timdebiterad hjälp kostar mer per tillfälle men kan vara rimligare om behovet är sällsynt.',
      },
      {
        q: 'Hur snabbt får vi hjälp när något går sönder?',
        a: 'Det styrs av inställelsetiden i avtalet. Fråga efter den innan ni skriver på, och kontrollera om den gäller alla ärenden eller bara sådana som stoppar verksamheten.',
      },
      {
        q: 'Behöver vi en egen server?',
        a: 'För de flesta mindre företag räcker molntjänster, som kräver mindre underhåll och har säkerhetskopiering inbyggd. En egen server kan behövas vid särskilda krav på lagring eller system som inte finns i molnet.',
      },
    ],
  },
  affarsstod: {
    heading: 'Hitta administrativ hjälp och affärsstöd',
    description:
      'Jämför offerter från svenska konsulter för administration, kundtjänst, projektledning och affärsstöd.',
    intro:
      'Behöver ni avlastning med administration, kundkontakt eller projektledning? Beskriv vad som tar tid idag, så kan konsulter föreslå upplägg.',
    examples: [
      'Löpande administration och fakturering',
      'Kundtjänst via mejl och telefon',
      'Projektledning av ett avgränsat uppdrag',
      'Research och underlag inför beslut',
      'Ordning i system och rutiner',
    ],
    priceGuide: [
      { label: 'Administrativ hjälp, per timme', range: '400–900 kr' },
      { label: 'Kundtjänst, löpande', range: '5 000–20 000 kr/mån' },
      { label: 'Projektledning, per timme', range: '800–1 500 kr' },
      { label: 'Avgränsat utredningsuppdrag', range: '10 000–50 000 kr' },
    ],
    faq: [
      {
        q: 'Vad kostar administrativ hjälp?',
        a: 'Ofta mellan 400 och 900 kronor i timmen beroende på hur specialiserad uppgiften är. Många konsulter erbjuder ett månadsupplägg med ett bestämt antal timmar, vilket blir billigare per timme.',
      },
      {
        q: 'Lönar det sig jämfört med att anställa?',
        a: 'Vid ett behov som varierar eller understiger en halvtid är en konsult oftast både billigare och enklare. Är behovet stabilt och heltid är anställning normalt mer ekonomiskt.',
      },
      {
        q: 'Hur kommer vi igång?',
        a: 'Börja med ett avgränsat uppdrag så ni ser hur samarbetet fungerar innan ni utökar. Beskriv vad som tar mest tid idag, så kan konsulten föreslå var avlastningen ger mest effekt.',
      },
    ],
  },
}

export function getCategoryContent(value: string): CategoryContent | null {
  return CONTENT[value] ?? null
}

/** Kategorier som har redaktionellt innehåll och därmed en egen landningssida. */
export const LANDING_CATEGORIES = CATEGORIES
  .filter(category => category.value in CONTENT)
  .map(category => category.value as CategoryValue)
