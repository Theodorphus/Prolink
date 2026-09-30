import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site'

export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Prolink – där företag och frilansare möts',
}

/**
 * Metadata för en indexerbar sida.
 *
 * Next.js ersätter openGraph och twitter i sin helhet när en sida anger
 * egna värden, i stället för att slå ihop dem med layoutens. Sidor som satte
 * openGraph tappade därför delningsbilden, och sidor som inte gjorde det
 * ärvde layoutens og:url, så en delad /services-länk pekade på startsidan.
 * Den här hjälparen sätter alltid titel, adress och bild tillsammans.
 *
 * twitter:image utelämnas med avsikt: X faller tillbaka på og:image, och då
 * används även de dynamiska delningsbilderna för tjänster och uppdrag.
 */
export function pageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  routeImage = false,
}: {
  title?: string
  absoluteTitle?: string
  description: string
  path: string
  /**
   * Sant när segmentet har en egen opengraph-image-fil. En bild i
   * konfigurationen vinner annars över filen, så standardbilden utelämnas.
   */
  routeImage?: boolean
}): Metadata {
  const shareTitle = absoluteTitle ?? title ?? 'Prolink'
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'Prolink',
      locale: 'sv_SE',
      title: shareTitle,
      description,
      url: path,
      ...(routeImage ? {} : { images: [DEFAULT_OG_IMAGE] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
    },
  }
}

/**
 * Bygger en metabeskrivning av flera delar och kortar den vid ordgräns.
 * Beskrivningar från användare kan vara några få ord ("Skapar hemsidor"),
 * så de kompletteras med fakta som kategori, pris och ort.
 */
export function metaDescription(...parts: (string | null | undefined | false)[]): string {
  const text = parts
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map(part => part.replace(/\s+/g, ' ').trim())
    .join(' ')
  if (text.length <= 155) return text
  const cut = text.slice(0, 154)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 120)).replace(/[\s,.;:–-]+$/, '')}…`
}

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
