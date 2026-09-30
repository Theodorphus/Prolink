/**
 * Strukturerad data för sökmotorer.
 *
 * Innehållet kommer delvis från användare (tjänstetitlar, beskrivningar,
 * namn). JSON.stringify escapar inte <, så en titel med </script> skulle
 * annars avsluta skripttaggen och resten tolkas som HTML. Därför ersätts <
 * med sin Unicode-escape, som JSON-tolken läser tillbaka som samma tecken.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
