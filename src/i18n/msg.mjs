// Markerar en text som ska översättas men som skrivs ner på ett ställe och
// översätts på ett annat. Funktionen gör inget själv; den finns så att
// översättningstestet hittar texten. Ligger som .mjs så att även modulerna som
// körs direkt av node --test (t.ex. trust.mjs) kan använda den.
export const msg = text => text
