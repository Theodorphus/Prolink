const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+)/gi
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/

/** Gör http(s)- och www-länkar i fri text klickbara. Övrig text renderas som vanlig text. */
export default function LinkifiedText({ text, className, linkClassName = 'text-blue-600 underline underline-offset-2 break-all hover:text-blue-700' }: {
  text: string
  className?: string
  /** Länkfärg m.m., t.ex. för ljus text på blå bakgrund. */
  linkClassName?: string
}) {
  const parts = text.split(URL_PATTERN)

  return (
    <p className={className}>
      {parts.map((part, index) => {
        // split med fångstgrupp lägger länkarna på udda index
        if (index % 2 === 0) return part

        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? ''
        const url = trailing ? part.slice(0, -trailing.length) : part
        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`

        return (
          <span key={index}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className={linkClassName}
            >
              {url}
            </a>
            {trailing}
          </span>
        )
      })}
    </p>
  )
}
