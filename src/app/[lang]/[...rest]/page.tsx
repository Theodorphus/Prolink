import { notFound } from 'next/navigation'

// Rotlayouten ligger under [lang], så okända adresser matchade ingen route och
// fick Nexts nakna standardsida på engelska, utan navigering. Den här rutten
// fångar dem i stället, så att [lang]/not-found.tsx visas i sidans layout och
// på besökarens språk. Specifika rutter går alltid före en catch-all.
export default function UnknownPage(): never {
  notFound()
}
