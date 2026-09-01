/**
 * Hjälteillustration: företag till vänster, frilansare till höger, uppdraget
 * som knyter ihop dem i mitten. Ren SVG i stället för en bildfil, så att den är
 * skarp i alla upplösningar, väger nästan ingenting och kan följa temafärgerna.
 *
 * Dekorativ: markerad aria-hidden, eftersom rubriken redan bär budskapet.
 */
export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="pl-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity=".05" />
        </linearGradient>
        <linearGradient id="pl-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id="pl-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" stopOpacity=".1" />
          <stop offset="50%" stopColor="#818cf8" stopOpacity=".85" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity=".1" />
        </linearGradient>
        <filter id="pl-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* Glöd bakom mittkortet */}
      <ellipse cx="260" cy="210" rx="150" ry="96" fill="#6366f1" opacity=".22" filter="url(#pl-blur)" />

      {/* Förbindelselinje mellan de två sidorna */}
      <path
        d="M118 214 C 178 214, 190 168, 260 168 C 330 168, 342 214, 402 214"
        stroke="url(#pl-line)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Vänster: företaget */}
      <g className="float-slow" style={{ animationDelay: '-1.2s' }}>
        <rect x="40" y="168" width="96" height="92" rx="16" fill="url(#pl-card)" stroke="#ffffff" strokeOpacity=".2" />
        <rect x="58" y="188" width="34" height="6" rx="3" fill="#ffffff" fillOpacity=".55" />
        <rect x="58" y="202" width="60" height="6" rx="3" fill="#ffffff" fillOpacity=".28" />
        <rect x="58" y="216" width="48" height="6" rx="3" fill="#ffffff" fillOpacity=".28" />
        <rect x="58" y="236" width="40" height="12" rx="6" fill="#6366f1" fillOpacity=".8" />
      </g>

      {/* Mitten: uppdragskortet */}
      <g className="float-slow">
        <rect x="176" y="118" width="168" height="184" rx="20" fill="url(#pl-card)" stroke="#ffffff" strokeOpacity=".26" />

        <rect x="198" y="142" width="58" height="8" rx="4" fill="#818cf8" />
        <rect x="198" y="164" width="120" height="9" rx="4.5" fill="#ffffff" fillOpacity=".82" />
        <rect x="198" y="181" width="96" height="9" rx="4.5" fill="#ffffff" fillOpacity=".82" />

        <rect x="198" y="208" width="124" height="6" rx="3" fill="#ffffff" fillOpacity=".22" />
        <rect x="198" y="222" width="108" height="6" rx="3" fill="#ffffff" fillOpacity=".22" />
        <rect x="198" y="236" width="116" height="6" rx="3" fill="#ffffff" fillOpacity=".22" />

        {/* Budgetrad */}
        <rect x="198" y="262" width="72" height="22" rx="11" fill="#2dd4bf" fillOpacity=".22" />
        <rect x="210" y="270" width="48" height="6" rx="3" fill="#5eead4" />
        <circle cx="308" cy="273" r="14" fill="url(#pl-accent)" />
        <path d="M302 273l4 4 8-8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Höger: frilansarna */}
      <g className="float-slow" style={{ animationDelay: '-3.4s' }}>
        <rect x="384" y="150" width="96" height="128" rx="16" fill="url(#pl-card)" stroke="#ffffff" strokeOpacity=".2" />

        {[0, 1, 2].map(i => (
          <g key={i} transform={`translate(0 ${i * 36})`}>
            <circle cx="410" cy="180" r="11" fill="#ffffff" fillOpacity={0.9 - i * 0.22} />
            <rect x="428" y="174" width="36" height="5" rx="2.5" fill="#ffffff" fillOpacity={0.5 - i * 0.12} />
            <rect x="428" y="184" width="24" height="5" rx="2.5" fill="#ffffff" fillOpacity={0.28 - i * 0.07} />
          </g>
        ))}
      </g>

      {/* Små accentprickar för djup */}
      <circle cx="150" cy="112" r="4" fill="#2dd4bf" opacity=".7" />
      <circle cx="372" cy="330" r="5" fill="#818cf8" opacity=".6" />
      <circle cx="96" cy="308" r="3" fill="#ffffff" opacity=".4" />
    </svg>
  )
}
