import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

// Intl formaterar belopp med hårda mellanslag, som standardtypsnittet i
// bildrenderingen inte alltid har tecken för.
function clean(value: string) {
  return value.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function clip(value: string, max: number) {
  const text = clean(value)
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/**
 * Delningsbild för tjänster, uppdrag och kategorisidor. En generisk bild för
 * alla länkar säger inget om vad länken gäller; med titel, kategori och pris
 * syns det direkt i förhandsvisningen på LinkedIn, Slack och i meddelanden.
 */
export function renderOgImage({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string | null }) {
  const heading = clip(title, 90)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #3730a3 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Prolink</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 3, textTransform: 'uppercase', color: '#a5b4fc' }}>
            {clip(eyebrow, 60)}
          </div>
          <div style={{ display: 'flex', marginTop: 20, fontSize: heading.length > 55 ? 56 : 70, lineHeight: 1.1, fontWeight: 700, letterSpacing: -2 }}>
            {heading}
          </div>
          {detail ? (
            <div style={{ display: 'flex', marginTop: 28, fontSize: 32, color: '#cbd5e1' }}>{clip(detail, 80)}</div>
          ) : null}
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#94a3b8' }}>Marknadsplatsen där företag och frilansare möts</div>
      </div>
    ),
    OG_SIZE,
  )
}
